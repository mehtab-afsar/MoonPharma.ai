import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getBatchReviews, saveAISummary } from "@/server/services/review.server"
import { getBatchById } from "@/server/services/batch.server"
import { generateBatchReviewSummary } from "@/server/ai/batch-reviewer"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { batchId } = await params
    const reviews = await getBatchReviews(batchId)
    // Use first available review, or create a reference by batchId
    const review = reviews[0]
    if (!review) return notFoundResponse("No review found for this batch — start a review first")

    // Fetch full batch data for AI analysis
    const batchData = await getBatchById(batchId, session.user.orgId)
    if (!batchData) return notFoundResponse("Batch not found")

    const aiSummary = await generateBatchReviewSummary(batchData)

    await saveAISummary(review.id, aiSummary, session.user.orgId)

    return successResponse({ aiSummary })
  } catch (error) {
    console.error("[POST /api/review/[batchId]/ai-summary]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate AI summary",
      500
    )
  }
}
