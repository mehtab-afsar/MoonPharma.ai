import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { startBatchStep } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { stepId } = await params
    const body = await request.json()
    const { equipmentId, envTemperature, envHumidity } = body

    const result = await startBatchStep({
      batchStepId: stepId,
      orgId: session.user.orgId,
      userId: session.user.id,
      equipmentId,
      envTemperature: envTemperature !== undefined ? Number(envTemperature) : undefined,
      envHumidity: envHumidity !== undefined ? Number(envHumidity) : undefined,
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/steps/[stepId]/start]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to start batch step",
      500
    )
  }
}
