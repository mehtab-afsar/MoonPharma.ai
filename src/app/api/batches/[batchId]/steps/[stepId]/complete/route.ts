import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { completeStep } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { batchId, stepId } = await params
    const body = await request.json()
    const { verifiedById, remarks, areaCleanVerified, equipmentCleanVerified } = body

    if (!verifiedById) {
      return errorResponse("Missing required field: verifiedById", 400)
    }

    const result = await completeStep({
      batchStepId: stepId,
      batchId,
      orgId: session.user.orgId,
      userId: session.user.id,
      verifiedById,
      remarks,
      areaCleanVerified,
      equipmentCleanVerified,
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/steps/[stepId]/complete]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to complete batch step",
      500
    )
  }
}
