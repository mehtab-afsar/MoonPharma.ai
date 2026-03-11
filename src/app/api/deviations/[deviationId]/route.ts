import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getDeviationById, updateDeviation } from "@/server/services/deviation.server"
import { DeviationStatus } from "@/generated/prisma"

interface RouteContext {
  params: Promise<{ deviationId: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { deviationId } = await params
    const deviation = await getDeviationById(deviationId, session.user.orgId)
    if (!deviation) return notFoundResponse("Deviation not found")

    return successResponse(deviation)
  } catch (error) {
    console.error("[GET /api/deviations/:deviationId]", error)
    return errorResponse("Failed to fetch deviation", 500)
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { deviationId } = await params
    const body = await request.json()
    const { rootCause, impactAssessment, correctiveAction, preventiveAction, status } = body

    if (status !== undefined) {
      const validStatuses = Object.values(DeviationStatus)
      if (!validStatuses.includes(status)) {
        return errorResponse(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          400
        )
      }
    }

    const deviation = await updateDeviation({
      id: deviationId,
      orgId: session.user.orgId,
      userId: session.user.id,
      rootCause,
      impactAssessment,
      correctiveAction,
      preventiveAction,
      status,
    })

    return successResponse(deviation)
  } catch (error) {
    console.error("[PUT /api/deviations/:deviationId]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update deviation",
      500
    )
  }
}
