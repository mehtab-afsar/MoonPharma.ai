import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { dispenseMaterial } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await params
    const body = await request.json()
    const {
      arNumber,
      supplierBatchNumber,
      actualQuantity,
      tareWeight,
      grossWeight,
      tolerancePlus,
      toleranceMinus,
      requiredQuantity,
    } = body

    if (
      actualQuantity === undefined ||
      tolerancePlus === undefined ||
      toleranceMinus === undefined ||
      requiredQuantity === undefined
    ) {
      return errorResponse(
        "Missing required fields: actualQuantity, tolerancePlus, toleranceMinus, requiredQuantity",
        400
      )
    }

    const result = await dispenseMaterial({
      batchMaterialId: materialId,
      orgId: session.user.orgId,
      userId: session.user.id,
      arNumber,
      supplierBatchNumber,
      actualQuantity: Number(actualQuantity),
      tareWeight: tareWeight !== undefined ? Number(tareWeight) : undefined,
      grossWeight: grossWeight !== undefined ? Number(grossWeight) : undefined,
      tolerancePlus: Number(tolerancePlus),
      toleranceMinus: Number(toleranceMinus),
      requiredQuantity: Number(requiredQuantity),
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/materials/[materialId]/dispense]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to dispense material",
      500
    )
  }
}
