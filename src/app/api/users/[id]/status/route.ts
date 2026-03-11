import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const statusSchema = z.object({ isActive: z.boolean() })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params

    if (id === session.user.id) {
      return errorResponse("You cannot deactivate your own account", 400)
    }

    const body = await request.json()
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400)

    const user = await prisma.user.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!user) return errorResponse("User not found", 404)

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: parsed.data.isActive },
      select: { id: true, fullName: true, isActive: true },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/users/[id]/status]", error)
    return errorResponse("Failed to update user status", 500)
  }
}
