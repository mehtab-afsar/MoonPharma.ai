import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { completeBatch } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { batchId } = await params
    const body = await request.json()
    const { actualYieldValue, actualYieldUnit, theoreticalYield } = body

    if (
      actualYieldValue === undefined ||
      !actualYieldUnit ||
      theoreticalYield === undefined
    ) {
      return errorResponse(
        "Missing required fields: actualYieldValue, actualYieldUnit, theoreticalYield",
        400
      )
    }

    const result = await completeBatch({
      batchId,
      orgId: session.user.orgId,
      userId: session.user.id,
      actualYieldValue: Number(actualYieldValue),
      actualYieldUnit,
      theoreticalYield: Number(theoreticalYield),
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/complete]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to complete batch",
      500
    )
  }
}
