import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { addMBRParameter } from "@/server/services/mbr.server"
import type { ParameterType } from "@/generated/prisma"

interface RouteContext {
  params: Promise<{ mbrId: string; stepId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { stepId } = await context.params
    const body = await request.json()
    const {
      parameterName,
      parameterType,
      unit,
      targetValue,
      minValue,
      maxValue,
      selectionOptions,
      isCritical,
      sequenceOrder,
    } = body

    if (!parameterName || !parameterType || sequenceOrder === undefined) {
      return errorResponse("Missing required fields: parameterName, parameterType, sequenceOrder", 400)
    }

    const parameter = await addMBRParameter({
      mbrStepId: stepId,
      parameterName,
      parameterType: parameterType as ParameterType,
      unit,
      targetValue,
      minValue: minValue !== undefined && minValue !== "" ? Number(minValue) : undefined,
      maxValue: maxValue !== undefined && maxValue !== "" ? Number(maxValue) : undefined,
      selectionOptions: Array.isArray(selectionOptions) ? selectionOptions : undefined,
      isCritical: Boolean(isCritical),
      sequenceOrder: Number(sequenceOrder),
    })

    return successResponse(parameter, 201)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/steps/[stepId]/parameters]", error)
    return errorResponse("Failed to add process parameter", 500)
  }
}
