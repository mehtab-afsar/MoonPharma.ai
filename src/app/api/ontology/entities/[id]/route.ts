import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const patchEntitySchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { id } = await params
    const entity = await prisma.ontologyEntity.findFirst({
      where: { id, orgId: session.user.orgId, isActive: true },
      include: { attributes: { orderBy: { sortOrder: "asc" } } },
    })
    if (!entity) return notFoundResponse("Entity not found")
    return successResponse(entity)
  } catch (error) {
    console.error("[GET /api/ontology/entities/[id]]", error)
    return errorResponse("Failed to fetch entity", 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const entity = await prisma.ontologyEntity.findFirst({
      where: { id, orgId: session.user.orgId, isActive: true },
    })
    if (!entity) return notFoundResponse("Entity not found")

    const body = await request.json()
    const parsed = patchEntitySchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    // For system entities, only sortOrder and description are editable
    const updateData: Record<string, unknown> = {}
    if (entity.isSystem) {
      if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder
      if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    } else {
      Object.assign(updateData, parsed.data)
    }

    const updated = await prisma.ontologyEntity.update({ where: { id }, data: updateData })
    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/ontology/entities/[id]]", error)
    return errorResponse("Failed to update entity", 500)
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
    const entity = await prisma.ontologyEntity.findFirst({
      where: { id, orgId: session.user.orgId, isActive: true },
    })
    if (!entity) return notFoundResponse("Entity not found")
    if (entity.isSystem) return errorResponse("Cannot delete system entities", 403)

    await prisma.ontologyEntity.update({ where: { id }, data: { isActive: false } })
    return successResponse({ id })
  } catch (error) {
    console.error("[DELETE /api/ontology/entities/[id]]", error)
    return errorResponse("Failed to delete entity", 500)
  }
}
