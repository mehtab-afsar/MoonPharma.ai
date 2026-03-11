import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/server/db/prisma"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { id } = await params
    const template = await prisma.processTemplate.findFirst({
      where: { id, orgId: session.user.orgId },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
          include: {
            parameters: { orderBy: { sequenceOrder: "asc" } },
            ipcChecks: { orderBy: { sequenceOrder: "asc" } },
          },
        },
      },
    })

    if (!template) return errorResponse("Not found", 404)
    return successResponse(template)
  } catch (error) {
    console.error("[GET /api/process-templates/[id]]", error)
    return errorResponse("Failed to fetch template", 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Admin only", 403)

    const { id } = await params
    const body = await request.json()
    const { name, description, category, isActive } = body

    const template = await prisma.processTemplate.updateMany({
      where: { id, orgId: session.user.orgId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    })

    if (template.count === 0) return errorResponse("Not found", 404)
    return successResponse({ updated: true })
  } catch (error) {
    console.error("[PATCH /api/process-templates/[id]]", error)
    return errorResponse("Failed to update template", 500)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Admin only", 403)

    const { id } = await params
    const template = await prisma.processTemplate.findFirst({
      where: { id, orgId: session.user.orgId },
    })

    if (!template) return errorResponse("Not found", 404)
    if (template.isSystem) return errorResponse("System templates cannot be deleted", 403)

    await prisma.processTemplate.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/process-templates/[id]]", error)
    return errorResponse("Failed to delete template", 500)
  }
}
