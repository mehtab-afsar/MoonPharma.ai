import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
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

    const invitation = await prisma.invitation.findFirst({
      where: { id, orgId: session.user.orgId },
    })

    if (!invitation) return errorResponse("Invitation not found", 404)
    if (invitation.status !== "pending") {
      return errorResponse("Only pending invitations can be revoked", 400)
    }

    await prisma.invitation.update({
      where: { id },
      data: { status: "revoked" },
    })

    return successResponse({ revoked: true })
  } catch (error) {
    console.error("[DELETE /api/invitations/[id]]", error)
    return errorResponse("Failed to revoke invitation", 500)
  }
}
