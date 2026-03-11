import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { getBatches, initiateBatch } from "@/server/services/batch.server"
import { BatchStatus } from "@/generated/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get("status") ?? undefined

    let status: BatchStatus | undefined
    if (statusParam) {
      if (!Object.values(BatchStatus).includes(statusParam as BatchStatus)) {
        return errorResponse(
          `Invalid status. Must be one of: ${Object.values(BatchStatus).join(", ")}`,
          400
        )
      }
      status = statusParam as BatchStatus
    }

    const batches = await getBatches(session.user.orgId, status)
    return successResponse(batches)
  } catch (error) {
    console.error("[GET /api/batches]", error)
    return errorResponse("Failed to fetch batches", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { mbrId, manufacturingDate, expiryDate } = body

    if (!mbrId || !manufacturingDate) {
      return errorResponse("Missing required fields: mbrId, manufacturingDate", 400)
    }

    const batch = await initiateBatch({
      orgId: session.user.orgId,
      userId: session.user.id,
      mbrId,
      manufacturingDate: new Date(manufacturingDate),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    })

    return successResponse(batch, 201)
  } catch (error) {
    console.error("[POST /api/batches]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to initiate batch",
      500
    )
  }
}
