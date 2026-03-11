import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { verifyMaterialDispensing } from "@/server/services/batch.server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string; materialId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await params
    const result = await verifyMaterialDispensing({
      batchMaterialId: materialId,
      orgId: session.user.orgId,
      userId: session.user.id,
    })

    return successResponse(result)
  } catch (error) {
    console.error("[POST /api/batches/[batchId]/materials/[materialId]/verify]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to verify material dispensing",
      500
    )
  }
}
