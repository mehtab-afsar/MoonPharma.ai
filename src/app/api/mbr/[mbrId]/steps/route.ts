import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getMBRById, addMBRStep } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params
    const mbr = await getMBRById(mbrId, session.user.orgId)

    if (!mbr) return notFoundResponse("Master batch record not found")

    return successResponse(mbr.steps)
  } catch (error) {
    console.error("[GET /api/mbr/[mbrId]/steps]", error)
    return errorResponse("Failed to fetch MBR steps", 500)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params

    const existing = await getMBRById(mbrId, session.user.orgId)
    if (!existing) return notFoundResponse("Master batch record not found")

    const body = await request.json()
    const {
      stepNumber,
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
      parameters,
      ipcChecks,
    } = body

    if (!stepName || !instructions || stepNumber === undefined) {
      return errorResponse("Missing required fields: stepNumber, stepName, instructions", 400)
    }

    const step = await addMBRStep({
      mbrId,
      stepNumber: Number(stepNumber),
      stepName,
      stage,
      instructions,
      equipmentType,
      estimatedDurationMinutes: estimatedDurationMinutes ? Number(estimatedDurationMinutes) : undefined,
      requiresLineClearance: Boolean(requiresLineClearance),
      requiresEnvironmentalCheck: Boolean(requiresEnvironmentalCheck),
      envTempMin: envTempMin !== undefined && envTempMin !== "" ? Number(envTempMin) : undefined,
      envTempMax: envTempMax !== undefined && envTempMax !== "" ? Number(envTempMax) : undefined,
      envHumidityMin: envHumidityMin !== undefined && envHumidityMin !== "" ? Number(envHumidityMin) : undefined,
      envHumidityMax: envHumidityMax !== undefined && envHumidityMax !== "" ? Number(envHumidityMax) : undefined,
      parameters: Array.isArray(parameters) ? parameters : undefined,
      ipcChecks: Array.isArray(ipcChecks) ? ipcChecks : undefined,
    })

    return successResponse(step, 201)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/steps]", error)
    return errorResponse("Failed to add MBR step", 500)
  }
}
