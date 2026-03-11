import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction, BatchStatus, ReviewType, ReviewStatus } from "@/generated/prisma"

// ============================================
// REVIEW QUEUE — completed batches awaiting QA
// ============================================

export async function getReviewQueue(orgId: string) {
  return prisma.batch.findMany({
    where: {
      orgId,
      status: { in: [BatchStatus.completed, BatchStatus.approved] },
    },
    include: {
      mbr: {
        include: {
          product: { select: { productName: true, strength: true, dosageForm: true } },
        },
      },
      initiatedBy: { select: { fullName: true, employeeId: true } },
      reviews: {
        include: {
          reviewer: { select: { fullName: true, employeeId: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { deviations: true } },
    },
    orderBy: { completedAt: "desc" },
  })
}

// ============================================
// GET REVIEWS FOR A BATCH
// ============================================

export async function getBatchReviews(batchId: string) {
  return prisma.batchReview.findMany({
    where: { batchId },
    include: {
      reviewer: { select: { fullName: true, employeeId: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  })
}

// ============================================
// START A REVIEW STAGE
// ============================================

export async function startReviewStage(params: {
  batchId: string
  orgId: string
  userId: string
  reviewType: ReviewType
}) {
  // Check it doesn't already exist for this batch+type
  const existing = await prisma.batchReview.findFirst({
    where: { batchId: params.batchId, reviewType: params.reviewType },
  })
  if (existing) throw new Error("A review of this type already exists for this batch")

  const review = await prisma.batchReview.create({
    data: {
      batchId: params.batchId,
      reviewType: params.reviewType,
      reviewerId: params.userId,
      status: ReviewStatus.in_progress,
      startedAt: new Date(),
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "batch_reviews",
    recordId: review.id,
    newValue: JSON.stringify({ batchId: params.batchId, reviewType: params.reviewType }),
  })

  return review
}

// ============================================
// COMPLETE A REVIEW STAGE
// ============================================

export async function completeReviewStage(params: {
  reviewId: string
  orgId: string
  userId: string
  status: "approved" | "rejected" | "returned_for_correction"
  comments?: string
}) {
  const statusMap: Record<string, ReviewStatus> = {
    approved: ReviewStatus.approved,
    rejected: ReviewStatus.rejected,
    returned_for_correction: ReviewStatus.returned_for_correction,
  }

  const review = await prisma.batchReview.update({
    where: { id: params.reviewId },
    data: {
      status: statusMap[params.status],
      comments: params.comments,
      completedAt: new Date(),
    },
  })

  // If QA Head approves, update batch status to approved
  if (params.status === "approved" && review.reviewType === ReviewType.qa_head_approval) {
    await prisma.batch.update({
      where: { id: review.batchId },
      data: { status: BatchStatus.approved },
    })
  }

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batch_reviews",
    recordId: params.reviewId,
    fieldName: "status",
    newValue: params.status,
  })

  return review
}

// ============================================
// SAVE AI SUMMARY
// ============================================

export async function saveAISummary(
  reviewId: string,
  aiSummary: string,
  orgId: string,
  aiFlaggedIssues?: object
) {
  const review = await prisma.batchReview.update({
    where: { id: reviewId },
    data: {
      aiReviewSummary: aiSummary,
      ...(aiFlaggedIssues ? { aiFlaggedIssues } : {}),
    },
  })

  await logAudit({
    orgId,
    userId: "system",
    action: AuditAction.UPDATE,
    tableName: "batch_reviews",
    recordId: reviewId,
    fieldName: "ai_review_summary",
    newValue: "generated",
  })

  return review
}
