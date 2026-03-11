import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { addMBRIPCCheck } from "@/server/services/mbr.server"
import type { CheckType } from "@/generated/prisma"

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
      checkName,
      checkType,
      unit,
      specification,
      targetValue,
      minValue,
      maxValue,
      frequency,
      sampleSize,
      isCritical,
      sequenceOrder,
    } = body

    if (!checkName || !checkType || sequenceOrder === undefined) {
      return errorResponse("Missing required fields: checkName, checkType, sequenceOrder", 400)
    }

    const ipcCheck = await addMBRIPCCheck({
      mbrStepId: stepId,
      checkName,
      checkType: checkType as CheckType,
      unit,
      specification,
      targetValue: targetValue !== undefined && targetValue !== "" ? Number(targetValue) : undefined,
      minValue: minValue !== undefined && minValue !== "" ? Number(minValue) : undefined,
      maxValue: maxValue !== undefined && maxValue !== "" ? Number(maxValue) : undefined,
      frequency,
      sampleSize,
      isCritical: Boolean(isCritical),
      sequenceOrder: Number(sequenceOrder),
    })

    return successResponse(ipcCheck, 201)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/steps/[stepId]/ipc-checks]", error)
    return errorResponse("Failed to add IPC check", 500)
  }
}
