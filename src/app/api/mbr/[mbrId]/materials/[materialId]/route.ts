import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { updateMBRMaterial, deleteMBRMaterial } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string; materialId: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await context.params
    const body = await request.json()
    const {
      quantity,
      unit,
      tolerancePlus,
      toleranceMinus,
      stage,
      isCritical,
      instructions,
    } = body

    const updated = await updateMBRMaterial(materialId, {
      quantity: quantity !== undefined ? Number(quantity) : undefined,
      unit,
      tolerancePlus: tolerancePlus !== undefined ? Number(tolerancePlus) : undefined,
      toleranceMinus: toleranceMinus !== undefined ? Number(toleranceMinus) : undefined,
      stage,
      isCritical: isCritical !== undefined ? Boolean(isCritical) : undefined,
      instructions,
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PUT /api/mbr/[mbrId]/materials/[materialId]]", error)
    return errorResponse("Failed to update MBR material", 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await context.params
    await deleteMBRMaterial(materialId)

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/mbr/[mbrId]/materials/[materialId]]", error)
    return errorResponse("Failed to delete MBR material", 500)
  }
}
