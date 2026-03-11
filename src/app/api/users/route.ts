import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { hashPassword, hashPin } from "@/server/utils/crypto"
import { UserRole } from "@/generated/prisma"
import { z } from "zod"

const createUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  employeeId: z.string().min(1),
  role: z.nativeEnum(UserRole),
  designation: z.string().optional(),
  password: z.string().min(8),
  pin: z.string().length(4).regex(/^\d{4}$/),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const users = await prisma.user.findMany({
      where: { orgId: session.user.orgId },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeId: true,
        role: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    return successResponse(users)
  } catch (error) {
    console.error("[GET /api/users]", error)
    return errorResponse("Failed to fetch users", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    // Only admins can create users
    if (session.user.role !== "admin") {
      return errorResponse("Forbidden", 403)
    }

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { fullName, email, employeeId, role, designation, password, pin } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { employeeId, orgId: session.user.orgId }] },
    })

    if (existing) {
      return errorResponse("A user with this email or employee ID already exists", 409)
    }

    const passwordHash = await hashPassword(password)
    const pinHash = await hashPin(pin)

    const user = await prisma.user.create({
      data: {
        orgId: session.user.orgId,
        fullName,
        email,
        employeeId,
        role,
        designation,
        passwordHash,
        eSignaturePinHash: pinHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        employeeId: true,
        role: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    })

    return successResponse(user, 201)
  } catch (error) {
    console.error("[POST /api/users]", error)
    return errorResponse("Failed to create user", 500)
  }
}
