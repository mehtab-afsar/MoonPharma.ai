import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getBatchReviews, startReviewStage, completeReviewStage } from "@/server/services/review.server"
import { ReviewType, ReviewStatus } from "@/generated/prisma"

const ALLOWED_ROLES = ["qa_head", "admin"]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return forbiddenResponse("Only QA Head or Admin can submit QA Head approval")
    }

    const { batchId } = await params
    const body = await request.json()
    const { action, status, comments } = body

    const reviews = await getBatchReviews(batchId)
    const qaReview = reviews.find((r) => r.reviewType === ReviewType.qa_review)
    const headReview = reviews.find((r) => r.reviewType === ReviewType.qa_head_approval)

    if (!qaReview || qaReview.status !== ReviewStatus.approved) {
      return errorResponse("QA review (Stage 1) must be approved before QA Head approval", 400)
    }

    if (action === "start") {
      if (headReview) return errorResponse("QA Head approval already started", 409)
      const review = await startReviewStage({
        batchId,
        orgId: session.user.orgId,
        userId: session.user.id,
        reviewType: ReviewType.qa_head_approval,
      })
      return successResponse(review)
    }

    if (action === "complete") {
      if (!headReview) return notFoundResponse("QA Head approval not started yet")
      if (!status || !["approved", "rejected", "returned_for_correction"].includes(status)) {
        return errorResponse("Invalid status", 400)
      }
      const updated = await completeReviewStage({
        reviewId: headReview.id,
        orgId: session.user.orgId,
        userId: session.user.id,
        status,
        comments,
      })
      return successResponse(updated)
    }

    return errorResponse('action must be "start" or "complete"', 400)
  } catch (error) {
    console.error("[POST /api/review/[batchId]/stage2]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to process QA Head approval",
      500
    )
  }
}
