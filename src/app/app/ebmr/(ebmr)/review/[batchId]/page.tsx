"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  User,
  Calendar,
  FileText,
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

// ============================================
// TYPES
// ============================================

interface BatchReviewDetail {
  id: string
  status: string
  aiSummary: string | null
  aiSummaryAt: string | null
  stage1ReviewerId: string | null
  stage1At: string | null
  stage1Status: string | null
  stage1Notes: string | null
  stage1Reviewer: { fullName: string; employeeId: string; role: string } | null
  stage2ReviewerId: string | null
  stage2At: string | null
  stage2Status: string | null
  stage2Notes: string | null
  stage2Reviewer: { fullName: string; employeeId: string; role: string } | null
  stage3ReviewerId: string | null
  stage3At: string | null
  stage3Status: string | null
  stage3Notes: string | null
  stage3Reviewer: { fullName: string; employeeId: string; role: string } | null
  batch: {
    id: string
    batchNumber: string
    status: string
    manufacturingDate: string | null
    completedAt: string | null
    yieldPercentage: number | null
    actualYieldValue: number | null
    actualYieldUnit: string | null
    mbr: {
      mbrCode: string
      version: number
      product: {
        productName: string
        strength: string | null
        dosageForm: string | null
      }
    }
    initiatedBy: {
      fullName: string
      employeeId: string
    }
    deviations: Array<{
      deviationNumber: string
      severity: string
      status: string
    }>
    _count: {
      deviations: number
    }
  }
}

// ============================================
// CONSTANTS
// ============================================

const STAGE_STATUS_COLORS: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

const DEVIATION_SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-yellow-100 text-yellow-700",
  major: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchReview(batchId: string): Promise<BatchReviewDetail | null> {
  const res = await fetch(`/api/review/${batchId}`)
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? null
}

// ============================================
// STAGE REVIEW PANEL
// ============================================

interface StageReviewPanelProps {
  stageNumber: 1 | 2 | 3
  stageLabel: string
  stageRole: string
  reviewer: { fullName: string; employeeId: string } | null
  at: string | null
  status: string | null
  notes: string | null
  canReview: boolean
  isActive: boolean
  batchId: string
  onReviewSubmitted: () => void
}

function StageReviewPanel({
  stageNumber,
  stageLabel,
  stageRole,
  reviewer,
  at,
  status,
  notes,
  canReview,
  isActive,
  batchId,
  onReviewSubmitted,
}: StageReviewPanelProps) {
  const [reviewNotes, setReviewNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitReview = async (reviewStatus: "approved" | "rejected") => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/review/${batchId}/stage${stageNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: reviewStatus, notes: reviewNotes || undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Failed to submit review")
        return
      }
      setReviewNotes("")
      onReviewSubmitted()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const isCompleted = status != null
  const isPending = !isActive && !isCompleted

  return (
    <Card
      className={`border shadow-sm flex-1 min-w-0 ${
        isPending
          ? "border-gray-200 opacity-60"
          : isCompleted && status === "approved"
          ? "border-green-200"
          : isCompleted && status === "rejected"
          ? "border-red-200"
          : "border-blue-200"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-gray-900">
              Stage {stageNumber}: {stageLabel}
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">{stageRole}</CardDescription>
          </div>
          {isCompleted ? (
            <Badge
              variant="outline"
              className={`text-xs border-transparent shrink-0 ${
                STAGE_STATUS_COLORS[status!] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {status === "approved" ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {status!.charAt(0).toUpperCase() + status!.slice(1)}
            </Badge>
          ) : isActive ? (
            <Badge variant="outline" className="text-xs border-transparent bg-blue-100 text-blue-700 shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              Awaiting
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-transparent bg-gray-100 text-gray-400 shrink-0">
              Not Started
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Reviewer info if completed */}
        {isCompleted && reviewer && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <User className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-medium">{reviewer.fullName}</span>
              <span className="text-gray-400">({reviewer.employeeId})</span>
            </div>
            {at && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {new Date(at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
            {notes && (
              <div className="mt-2 rounded-md bg-gray-50 border border-gray-100 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">Notes</span>
                </div>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Action area if can review and not yet reviewed */}
        {canReview && isActive && !isCompleted && (
          <div className="space-y-3">
            <Textarea
              placeholder="Add review notes (optional)..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="text-sm resize-none min-h-[80px]"
              disabled={submitting}
            />
            {error && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => submitReview("approved")}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 gap-1.5"
                onClick={() => submitReview("rejected")}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                Reject
              </Button>
            </div>
          </div>
        )}

        {/* Not active and no info */}
        {isPending && (
          <p className="text-xs text-gray-400">
            Available after Stage {stageNumber - 1} is approved.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function BatchReviewDetailPage() {
  const params = useParams()
  const { data: session } = useSession()
  const batchId = params.batchId as string

  const [review, setReview] = useState<BatchReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  const loadReview = useCallback(async () => {
    const data = await fetchReview(batchId)
    setReview(data)
    setLoading(false)
  }, [batchId])

  useEffect(() => {
    loadReview()
  }, [loadReview])

  const handleGenerateAI = async () => {
    setGeneratingAI(true)
    setAiError(null)
    try {
      const res = await fetch(`/api/review/${batchId}/ai-summary`, {
        method: "POST",
      })
      const json = await res.json()
      if (!res.ok) {
        setAiError(json.message ?? "Failed to generate AI summary")
        return
      }
      await loadReview()
    } catch {
      setAiError("Network error. Please try again.")
    } finally {
      setGeneratingAI(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">Review record not found for this batch.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.REVIEW_QUEUE}>Back to Review Queue</Link>
        </Button>
      </div>
    )
  }

  const userRole = session?.user?.role ?? ""

  // Stage activity logic
  const stage1Active = review.stage1Status == null
  const stage2Active = review.stage1Status === "approved" && review.stage2Status == null
  const stage3Active = review.stage2Status === "approved" && review.stage3Status == null

  const canDoStage1 = ["qa_reviewer", "qa_head", "admin"].includes(userRole)
  const canDoStage2 = ["qa_head", "admin"].includes(userRole)
  const canDoStage3 = ["production_head", "admin"].includes(userRole)

  const batch = review.batch

  const REVIEW_STATUS_COLORS: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    in_review: "bg-blue-100 text-blue-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  }

  const REVIEW_STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    in_review: "In Review",
    approved: "Approved",
    rejected: "Rejected",
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-gray-600">
          <Link href={ROUTES.REVIEW_QUEUE}>
            <ArrowLeft className="h-4 w-4" />
            Back to Review Queue
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900 font-mono">
              {batch.batchNumber}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs border-transparent ${
                REVIEW_STATUS_COLORS[review.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {REVIEW_STATUS_LABELS[review.status] ?? review.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {batch.mbr?.product?.productName}
            {batch.mbr?.product?.strength && ` · ${batch.mbr.product.strength}`}
            {batch.mbr?.product?.dosageForm && ` · ${batch.mbr.product.dosageForm}`}
            {" · "}
            <span className="font-mono">{batch.mbr?.mbrCode}</span> v{batch.mbr?.version}
          </p>
        </div>
      </div>

      {/* Batch Info Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Manufacturing Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch.manufacturingDate
                ? new Date(batch.manufacturingDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Completed Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch.completedAt
                ? new Date(batch.completedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Yield %</p>
            <p
              className={`mt-1 text-sm font-medium ${
                batch.yieldPercentage != null
                  ? batch.yieldPercentage >= 98
                    ? "text-green-700"
                    : batch.yieldPercentage >= 95
                    ? "text-yellow-700"
                    : "text-red-700"
                  : "text-gray-900"
              }`}
            >
              {batch.yieldPercentage != null
                ? `${Number(batch.yieldPercentage).toFixed(2)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Deviations</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch._count?.deviations ?? 0}
              {(batch._count?.deviations ?? 0) > 0 && (
                <span className="ml-2 text-xs text-red-600">(Review required)</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Initiated By */}
      <Card className="border border-gray-200 shadow-sm">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-400" />
            <span>Initiated by</span>
            <span className="font-medium text-gray-900">
              {batch.initiatedBy?.fullName ?? "—"}
            </span>
            {batch.initiatedBy?.employeeId && (
              <span className="text-gray-400 font-mono text-xs">
                ({batch.initiatedBy.employeeId})
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deviations Summary */}
      {batch.deviations && batch.deviations.length > 0 && (
        <Card className="border border-orange-200 shadow-sm bg-orange-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Deviations ({batch.deviations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batch.deviations.map((dev, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <Badge
                    variant="outline"
                    className={`text-xs border-transparent ${
                      DEVIATION_SEVERITY_COLORS[dev.severity] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {dev.severity}
                  </Badge>
                  <span className="font-mono text-xs text-gray-600">{dev.deviationNumber}</span>
                  <span className="text-xs text-gray-500 capitalize">{dev.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* AI Summary Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-500" />
                AI Review Summary
              </CardTitle>
              <CardDescription className="text-sm text-gray-500 mt-0.5">
                {review.aiSummary
                  ? `Generated ${
                      review.aiSummaryAt
                        ? new Date(review.aiSummaryAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""
                    }`
                  : "AI-assisted analysis of batch record quality and compliance"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              onClick={handleGenerateAI}
              disabled={generatingAI}
            >
              {generatingAI ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
              {review.aiSummary ? "Regenerate" : "Generate AI Summary"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aiError && (
            <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {aiError}
            </div>
          )}
          {review.aiSummary ? (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                {review.aiSummary}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Bot className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">No AI summary generated yet.</p>
              <p className="text-xs text-gray-400">
                Click the button above to analyze this batch record with AI.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Three Stage Review Panels */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Review Workflow</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <StageReviewPanel
            stageNumber={1}
            stageLabel="QA Reviewer Check"
            stageRole="Required role: QA Reviewer / QA Head"
            reviewer={review.stage1Reviewer}
            at={review.stage1At}
            status={review.stage1Status}
            notes={review.stage1Notes}
            canReview={canDoStage1}
            isActive={stage1Active}
            batchId={batchId}
            onReviewSubmitted={loadReview}
          />

          <div className="hidden lg:flex items-center text-gray-300 text-lg font-light">
            &rsaquo;
          </div>

          <StageReviewPanel
            stageNumber={2}
            stageLabel="QA Head Approval"
            stageRole="Required role: QA Head"
            reviewer={review.stage2Reviewer}
            at={review.stage2At}
            status={review.stage2Status}
            notes={review.stage2Notes}
            canReview={canDoStage2}
            isActive={stage2Active}
            batchId={batchId}
            onReviewSubmitted={loadReview}
          />

          <div className="hidden lg:flex items-center text-gray-300 text-lg font-light">
            &rsaquo;
          </div>

          <StageReviewPanel
            stageNumber={3}
            stageLabel="Production Head Sign-off"
            stageRole="Required role: Production Head"
            reviewer={review.stage3Reviewer}
            at={review.stage3At}
            status={review.stage3Status}
            notes={review.stage3Notes}
            canReview={canDoStage3}
            isActive={stage3Active}
            batchId={batchId}
            onReviewSubmitted={loadReview}
          />
        </div>
      </div>
    </div>
  )
}
