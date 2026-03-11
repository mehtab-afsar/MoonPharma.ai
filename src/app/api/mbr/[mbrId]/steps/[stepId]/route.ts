import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { updateMBRStep, deleteMBRStep } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string; stepId: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { stepId } = await context.params
    const body = await request.json()
    const {
      stepName,
      stage,
      instructions,
      equipmentType,
      estimatedDurationMinutes,
      requiresLineClearance,
      requiresEnvironmentalCheck,
      envTempMin,
      envTempMax,
      envHumidityMin,
      envHumidityMax,
    } = body

    const updated = await updateMBRStep(stepId, {
      stepName,
      stage,
      instructions,
      equipmentType,
      estimatedDurationMinutes: estimatedDurationMinutes !== undefined ? Number(estimatedDurationMinutes) : undefined,
      requiresLineClearance: requiresLineClearance !== undefined ? Boolean(requiresLineClearance) : undefined,
      requiresEnvironmentalCheck: requiresEnvironmentalCheck !== undefined ? Boolean(requiresEnvironmentalCheck) : undefined,
      envTempMin: envTempMin !== undefined && envTempMin !== "" ? Number(envTempMin) : undefined,
      envTempMax: envTempMax !== undefined && envTempMax !== "" ? Number(envTempMax) : undefined,
      envHumidityMin: envHumidityMin !== undefined && envHumidityMin !== "" ? Number(envHumidityMin) : undefined,
      envHumidityMax: envHumidityMax !== undefined && envHumidityMax !== "" ? Number(envHumidityMax) : undefined,
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PUT /api/mbr/[mbrId]/steps/[stepId]]", error)
    return errorResponse("Failed to update MBR step", 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { stepId } = await context.params
    await deleteMBRStep(stepId)

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/mbr/[mbrId]/steps/[stepId]]", error)
    return errorResponse("Failed to delete MBR step", 500)
  }
}
