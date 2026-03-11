import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/server/db/prisma"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Admin only", 403)

    const { id, stepId } = await params

    // Verify ownership
    const step = await prisma.stepTemplate.findFirst({
      where: { id: stepId, processTemplateId: id, orgId: session.user.orgId },
    })
    if (!step) return errorResponse("Step not found", 404)

    await prisma.stepTemplate.delete({ where: { id: stepId } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/process-templates/[id]/steps/[stepId]]", error)
    return errorResponse("Failed to delete step", 500)
  }
}
