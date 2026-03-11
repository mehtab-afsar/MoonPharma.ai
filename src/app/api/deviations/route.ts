import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { getDeviations, createDeviation } from "@/server/services/deviation.server"
import { DeviationCategory, DeviationSeverity, DeviationType } from "@/generated/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId") ?? undefined

    const deviations = await getDeviations(session.user.orgId, batchId)
    return successResponse(deviations)
  } catch (error) {
    console.error("[GET /api/deviations]", error)
    return errorResponse("Failed to fetch deviations", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { batchId, batchStepId, deviationType, category, severity, description, rootCause, impactAssessment } = body

    if (!batchId || !deviationType || !category || !severity || !description) {
      return errorResponse(
        "Missing required fields: batchId, deviationType, category, severity, description",
        400
      )
    }

    const validTypes = Object.values(DeviationType)
    if (!validTypes.includes(deviationType)) {
      return errorResponse(`Invalid deviationType. Must be one of: ${validTypes.join(", ")}`, 400)
    }

    const validCategories = Object.values(DeviationCategory)
    if (!validCategories.includes(category)) {
      return errorResponse(
        `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        400
      )
    }

    const validSeverities = Object.values(DeviationSeverity)
    if (!validSeverities.includes(severity)) {
      return errorResponse(
        `Invalid severity. Must be one of: ${validSeverities.join(", ")}`,
        400
      )
    }

    const deviation = await createDeviation({
      orgId: session.user.orgId,
      userId: session.user.id,
      batchId,
      batchStepId,
      deviationType,
      category,
      severity,
      description,
      rootCause,
      impactAssessment,
    })

    return successResponse(deviation, 201)
  } catch (error) {
    console.error("[POST /api/deviations]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create deviation",
      500
    )
  }
}
