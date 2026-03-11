import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { getMBRs, createMBR } from "@/server/services/mbr.server"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId") ?? undefined

    const mbrs = await getMBRs(session.user.orgId, productId)
    return successResponse(mbrs)
  } catch (error) {
    console.error("[GET /api/mbr]", error)
    return errorResponse("Failed to fetch master batch records", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const {
      productId,
      mbrCode,
      batchSizeValue,
      batchSizeUnit,
      theoreticalYieldValue,
      theoreticalYieldUnit,
      yieldLimitMin,
      yieldLimitMax,
      effectiveDate,
      reviewDate,
    } = body

    if (!productId || !mbrCode || !batchSizeValue || !batchSizeUnit) {
      return errorResponse("Missing required fields: productId, mbrCode, batchSizeValue, batchSizeUnit", 400)
    }

    const mbr = await createMBR({
      orgId: session.user.orgId,
      userId: session.user.id,
      productId,
      mbrCode,
      batchSizeValue: Number(batchSizeValue),
      batchSizeUnit,
      theoreticalYieldValue: theoreticalYieldValue ? Number(theoreticalYieldValue) : undefined,
      theoreticalYieldUnit,
      yieldLimitMin: yieldLimitMin ? Number(yieldLimitMin) : undefined,
      yieldLimitMax: yieldLimitMax ? Number(yieldLimitMax) : undefined,
      effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      reviewDate: reviewDate ? new Date(reviewDate) : undefined,
    })

    return successResponse(mbr, 201)
  } catch (error) {
    console.error("[POST /api/mbr]", error)
    return errorResponse("Failed to create master batch record", 500)
  }
}
