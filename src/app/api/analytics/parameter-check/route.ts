import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { checkParameterAnomaly } from "@/server/ai/anomaly-detector"
import { prisma } from "@/server/db/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { mbrStepId, parameterName, mbrParameterId, actualNumericValue } = body as {
      mbrStepId: string
      parameterName: string
      mbrParameterId: string
      actualNumericValue: number
    }

    if (!mbrStepId || !parameterName || actualNumericValue == null) {
      return errorResponse("mbrStepId, parameterName, and actualNumericValue are required")
    }

    // Fetch parameter spec limits
    const mbrParam = mbrParameterId
      ? await prisma.mBRStepParameter.findFirst({
          where: { id: mbrParameterId },
          select: { minValue: true, maxValue: true },
        })
      : null

    const result = await checkParameterAnomaly({
      mbrStepId,
      parameterName,
      actualNumericValue,
      orgId: session.user.orgId,
      minValue: mbrParam?.minValue ? Number(mbrParam.minValue) : null,
      maxValue: mbrParam?.maxValue ? Number(mbrParam.maxValue) : null,
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/analytics/parameter-check]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to check parameter anomaly",
      500
    )
  }
}
