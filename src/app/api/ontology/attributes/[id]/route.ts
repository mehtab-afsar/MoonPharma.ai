import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const patchAttributeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  enumOptions: z.array(z.string()).nullable().optional(),
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
    const attribute = await prisma.ontologyAttribute.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!attribute) return notFoundResponse("Attribute not found")

    const body = await request.json()
    const parsed = patchAttributeSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    const updated = await prisma.ontologyAttribute.update({
      where: { id },
      data: {
        ...(parsed.data.displayName !== undefined && { displayName: parsed.data.displayName }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
        ...(parsed.data.isRequired !== undefined && { isRequired: parsed.data.isRequired }),
        ...(parsed.data.enumOptions !== undefined && { enumOptions: parsed.data.enumOptions ?? undefined }),
      },
    })
    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/ontology/attributes/[id]]", error)
    return errorResponse("Failed to update attribute", 500)
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
    const attribute = await prisma.ontologyAttribute.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!attribute) return notFoundResponse("Attribute not found")
    if (attribute.isSystem) return errorResponse("Cannot delete system attributes", 403)

    await prisma.ontologyAttribute.delete({ where: { id } })
    return successResponse({ id })
  } catch (error) {
    console.error("[DELETE /api/ontology/attributes/[id]]", error)
    return errorResponse("Failed to delete attribute", 500)
  }
}
