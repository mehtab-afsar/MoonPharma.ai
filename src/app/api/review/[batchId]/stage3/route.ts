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

const ALLOWED_ROLES = ["production_head", "admin"]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    if (!ALLOWED_ROLES.includes(session.user.role)) {
      return forbiddenResponse("Only Production Head or Admin can submit production sign-off")
    }

    const { batchId } = await params
    const body = await request.json()
    const { action, status, comments } = body

    const reviews = await getBatchReviews(batchId)
    const headReview = reviews.find((r) => r.reviewType === ReviewType.qa_head_approval)
    const prodReview = reviews.find((r) => r.reviewType === ReviewType.production_review)

    if (!headReview || headReview.status !== ReviewStatus.approved) {
      return errorResponse("QA Head approval (Stage 2) must be approved before production sign-off", 400)
    }

    if (action === "start") {
      if (prodReview) return errorResponse("Production sign-off already started", 409)
      const review = await startReviewStage({
        batchId,
        orgId: session.user.orgId,
        userId: session.user.id,
        reviewType: ReviewType.production_review,
      })
      return successResponse(review)
    }

    if (action === "complete") {
      if (!prodReview) return notFoundResponse("Production sign-off not started yet")
      if (!status || !["approved", "rejected", "returned_for_correction"].includes(status)) {
        return errorResponse("Invalid status", 400)
      }
      const updated = await completeReviewStage({
        reviewId: prodReview.id,
        orgId: session.user.orgId,
        userId: session.user.id,
        status,
        comments,
      })
      return successResponse(updated)
    }

    return errorResponse('action must be "start" or "complete"', 400)
  } catch (error) {
    console.error("[POST /api/review/[batchId]/stage3]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to process production sign-off",
      500
    )
  }
}
