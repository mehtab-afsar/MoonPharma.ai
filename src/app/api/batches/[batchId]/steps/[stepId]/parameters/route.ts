import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { recordStepParameter } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string; stepId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { stepId } = await params
    const body = await request.json()
    const {
      mbrStepParameterId,
      parameterName,
      actualValue,
      actualNumericValue,
      minValue,
      maxValue,
    } = body

    if (!mbrStepParameterId || !parameterName || actualValue === undefined) {
      return errorResponse(
        "Missing required fields: mbrStepParameterId, parameterName, actualValue",
        400
      )
    }

    const result = await recordStepParameter({
      batchStepId: stepId,
      orgId: session.user.orgId,
      userId: session.user.id,
      mbrStepParameterId,
      parameterName,
      actualValue: String(actualValue),
      actualNumericValue: actualNumericValue !== undefined ? Number(actualNumericValue) : undefined,
      minValue: minValue !== undefined ? Number(minValue) : undefined,
      maxValue: maxValue !== undefined ? Number(maxValue) : undefined,
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/steps/[stepId]/parameters]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to record step parameter",
      500
    )
  }
}
