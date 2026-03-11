import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getBatchById } from "@/server/services/batch.server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { batchId } = await params
    const batch = await getBatchById(batchId, session.user.orgId)
    if (!batch) return notFoundResponse("Batch not found")

    const { materials, steps, ...rest } = batch
    return successResponse({ ...rest, batchMaterials: materials, batchSteps: steps })
  } catch (error) {
    console.error("[GET /api/batches/[batchId]]", error)
    return errorResponse("Failed to fetch batch", 500)
  }
}
