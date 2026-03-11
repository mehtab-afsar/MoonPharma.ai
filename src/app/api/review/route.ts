import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { getReviewQueue } from "@/server/services/review.server"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const batches = await getReviewQueue(session.user.orgId)

    const queue = batches.map((batch) => {
      const stage1 = batch.reviews.find((r) => r.reviewType === "production_review")
      const stage2 = batch.reviews.find((r) => r.reviewType === "qa_review")
      const stage3 = batch.reviews.find((r) => r.reviewType === "qa_head_approval")

      let status = "pending"
      if (stage3?.status === "approved") status = "approved"
      else if (
        stage1?.status === "rejected" ||
        stage2?.status === "rejected" ||
        stage3?.status === "rejected"
      )
        status = "rejected"
      else if (batch.reviews.length > 0) status = "in_review"

      return {
        id: batch.id,
        status,
        stage1Status: stage1?.status ?? null,
        stage2Status: stage2?.status ?? null,
        stage3Status: stage3?.status ?? null,
        stage1At: stage1?.completedAt ?? null,
        stage2At: stage2?.completedAt ?? null,
        stage3At: stage3?.completedAt ?? null,
        batch: {
          id: batch.id,
          batchNumber: batch.batchNumber,
          completedAt: batch.completedAt,
          yieldPercentage: batch.yieldPercentage,
          mbr: batch.mbr,
          _count: batch._count,
        },
      }
    })

    return successResponse(queue)
  } catch (error) {
    console.error("[GET /api/review]", error)
    return errorResponse("Failed to fetch review queue", 500)
  }
}
