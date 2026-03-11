import { successResponse, errorResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { hashPassword, hashPin } from "@/server/utils/crypto"
import { z } from "zod"

const acceptSchema = z.object({
  token: z.string().uuid(),
  password: z.string().min(8),
  pin: z.string().length(4).regex(/^\d{4}$/),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) return errorResponse("Token required", 400)

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { org: { select: { name: true } } },
    })

    if (!invitation) return errorResponse("Invitation not found or invalid", 404)
    if (invitation.status === "revoked") return errorResponse("This invitation has been revoked", 410)
    if (invitation.status === "accepted") return errorResponse("This invitation has already been accepted", 410)
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({ where: { token }, data: { status: "expired" } })
      return errorResponse("This invitation has expired. Ask your admin to resend it.", 410)
    }

    return successResponse({
      fullName: invitation.fullName,
      email: invitation.email,
      employeeId: invitation.employeeId,
      role: invitation.role,
      orgName: invitation.org.name,
    })
  } catch (error) {
    console.error("[GET /api/invitations/accept]", error)
    return errorResponse("Failed to validate invitation", 500)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = acceptSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { token, password, pin } = parsed.data

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { org: true },
    })

    if (!invitation) return errorResponse("Invitation not found", 404)
    if (invitation.status !== "pending") return errorResponse("This invitation is no longer valid", 410)
    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({ where: { token }, data: { status: "expired" } })
      return errorResponse("Invitation expired", 410)
    }

    // Check email not already taken
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: invitation.email }, { orgId: invitation.orgId, employeeId: invitation.employeeId }] },
    })
    if (existing) return errorResponse("A user with this email or employee ID already exists", 409)

    const passwordHash = await hashPassword(password)
    const pinHash = await hashPin(pin)

    const user = await prisma.user.create({
      data: {
        orgId: invitation.orgId,
        email: invitation.email,
        fullName: invitation.fullName,
        employeeId: invitation.employeeId,
        role: invitation.role,
        department: invitation.department ?? undefined,
        passwordHash,
        eSignaturePinHash: pinHash,
      },
      select: { id: true, email: true, fullName: true, role: true },
    })

    await prisma.invitation.update({
      where: { token },
      data: { status: "accepted", acceptedAt: new Date() },
    })

    return successResponse({ user }, 201)
  } catch (error) {
    console.error("[POST /api/invitations/accept]", error)
    return errorResponse("Failed to accept invitation", 500)
  }
}
