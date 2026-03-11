import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { UserRole } from "@/generated/prisma"
import { z } from "zod"

const createInvitationSchema = z.object({
  email: z.string().email("Valid email required"),
  fullName: z.string().min(2, "Full name required"),
  employeeId: z.string().min(1, "Employee ID required"),
  role: z.nativeEnum(UserRole),
  department: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const invitations = await prisma.invitation.findMany({
      where: { orgId: session.user.orgId },
      include: { invitedBy: { select: { fullName: true, employeeId: true } } },
      orderBy: { createdAt: "desc" },
    })

    // Mark expired ones in response (don't auto-update DB for read performance)
    const now = new Date()
    const enriched = invitations.map(inv => ({
      ...inv,
      isExpired: inv.status === "pending" && inv.expiresAt < now,
    }))

    return successResponse(enriched)
  } catch (error) {
    console.error("[GET /api/invitations]", error)
    return errorResponse("Failed to fetch invitations", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createInvitationSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { email, fullName, employeeId, role, department } = parsed.data

    // Check not already a user in this org
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { orgId: session.user.orgId, employeeId }] },
    })
    if (existingUser) {
      return errorResponse("A user with this email or employee ID already exists", 409)
    }

    // Check no pending invitation for this email in this org
    const existingInvite = await prisma.invitation.findFirst({
      where: { orgId: session.user.orgId, email, status: "pending" },
    })
    if (existingInvite && existingInvite.expiresAt > new Date()) {
      return errorResponse("A pending invitation already exists for this email", 409)
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        orgId: session.user.orgId,
        email,
        fullName,
        employeeId,
        role,
        department,
        token,
        expiresAt,
        invitedById: session.user.id,
      },
    })

    // Build the invitation link (use request origin)
    const origin = request.headers.get("origin") ?? "http://localhost:3000"
    const inviteLink = `${origin}/invitations/${token}`

    return successResponse({ ...invitation, inviteLink }, 201)
  } catch (error) {
    console.error("[POST /api/invitations]", error)
    return errorResponse("Failed to create invitation", 500)
  }
}
