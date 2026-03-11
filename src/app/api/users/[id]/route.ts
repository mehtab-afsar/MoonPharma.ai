import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { UserRole } from "@/generated/prisma"
import { z } from "zod"

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const user = await prisma.user.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!user) return errorResponse("User not found", 404)

    const updated = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true, fullName: true, email: true, employeeId: true,
        role: true, designation: true, department: true, isActive: true,
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/users/[id]]", error)
    return errorResponse("Failed to update user", 500)
  }
}
