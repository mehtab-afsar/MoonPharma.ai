import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { recordIPCResult } from "@/server/services/batch.server"

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
      mbrIpcId,
      checkName,
      checkTime,
      resultValue,
      resultNumeric,
      minValue,
      maxValue,
      remarks,
    } = body

    if (!mbrIpcId || !checkName || !checkTime || resultValue === undefined) {
      return errorResponse(
        "Missing required fields: mbrIpcId, checkName, checkTime, resultValue",
        400
      )
    }

    const result = await recordIPCResult({
      batchStepId: stepId,
      orgId: session.user.orgId,
      userId: session.user.id,
      mbrIpcId,
      checkName,
      checkTime: new Date(checkTime),
      resultValue: String(resultValue),
      resultNumeric: resultNumeric !== undefined ? Number(resultNumeric) : undefined,
      minValue: minValue !== undefined ? Number(minValue) : undefined,
      maxValue: maxValue !== undefined ? Number(maxValue) : undefined,
      remarks,
    })

    return successResponse(result, 201)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/steps/[stepId]/ipc-results]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to record IPC result",
      500
    )
  }
}
