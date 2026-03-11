import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const updateSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
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
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const category = await prisma.lookupCategory.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!category) return errorResponse("Category not found", 404)

    const updated = await prisma.lookupCategory.update({
      where: { id },
      data: parsed.data,
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/config/categories/[id]]", error)
    return errorResponse("Failed to update category", 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params

    const category = await prisma.lookupCategory.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!category) return errorResponse("Category not found", 404)
    if (category.isSystem) return errorResponse("System categories cannot be deleted", 403)

    await prisma.lookupCategory.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/config/categories/[id]]", error)
    return errorResponse("Failed to delete category", 500)
  }
}
