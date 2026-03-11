import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { closeDeviation } from "@/server/services/deviation.server"

interface RouteContext {
  params: Promise<{ deviationId: string }>
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { deviationId } = await params
    const deviation = await closeDeviation(
      deviationId,
      session.user.orgId,
      session.user.id
    )

    return successResponse(deviation)
  } catch (error) {
    console.error("[POST /api/deviations/:deviationId/close]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to close deviation",
      500
    )
  }
}
