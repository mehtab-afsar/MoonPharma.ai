import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const relationship = await prisma.ontologyRelationship.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!relationship) return notFoundResponse("Relationship not found")
    if (relationship.isSystem) return errorResponse("Cannot delete system relationships", 403)

    await prisma.ontologyRelationship.delete({ where: { id } })
    return successResponse({ id })
  } catch (error) {
    console.error("[DELETE /api/ontology/relationships/[id]]", error)
    return errorResponse("Failed to delete relationship", 500)
  }
}
