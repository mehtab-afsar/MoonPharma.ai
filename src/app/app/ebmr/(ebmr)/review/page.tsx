"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ClipboardCheck, Eye, Loader2 } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

// ============================================
// TYPES
// ============================================

interface BatchReviewItem {
  id: string
  status: string
  stage1Status: string | null
  stage2Status: string | null
  stage3Status: string | null
  stage1At: string | null
  stage2At: string | null
  stage3At: string | null
  batch: {
    id: string
    batchNumber: string
    completedAt: string | null
    yieldPercentage: number | null
    mbr: {
      product: {
        productName: string
        strength: string | null
        dosageForm: string | null
      }
    }
    _count: {
      deviations: number
    }
  }
}

// ============================================
// CONSTANTS
// ============================================

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

// ============================================
// DATA FETCHING
// ============================================

async function fetchReviewQueue(): Promise<BatchReviewItem[]> {
  const res = await fetch("/api/review")
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

// ============================================
// STAGE BADGE COMPONENT
// ============================================

function StageBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <Badge variant="outline" className="text-xs border-transparent bg-gray-100 text-gray-400">
        Pending
      </Badge>
    )
  }

  const color =
    status === "approved"
      ? "bg-green-100 text-green-700"
      : status === "rejected"
      ? "bg-red-100 text-red-700"
      : "bg-gray-100 text-gray-600"

  return (
    <Badge variant="outline" className={`text-xs border-transparent ${color}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function ReviewQueuePage() {
  const router = useRouter()

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["review-queue"],
    queryFn: fetchReviewQueue,
    refetchInterval: 30000,
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">QA Review Queue</h1>
            {!isLoading && (
              <Badge
                variant="outline"
                className="text-xs border border-gray-200 bg-gray-100 text-gray-600"
              >
                {reviews.length}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Batch records awaiting quality assurance review and approval.
          </p>
        </div>
      </div>

      {/* Review Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Batches Awaiting Review
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {isLoading
              ? "Loading..."
              : `${reviews.length} batch record${reviews.length !== 1 ? "s" : ""} in queue`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <ClipboardCheck className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No batches awaiting review</p>
              <p className="text-xs text-gray-400">
                Completed batches will appear here for QA review.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">
                    Batch Number
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Product</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Completed Date
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Yield %</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Deviations</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Stage 1 (QA Reviewer)
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Stage 2 (QA Head)
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Stage 3 (Prod. Head)
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer border-gray-100 hover:bg-gray-50/50"
                    onClick={() => router.push(ROUTES.REVIEW_DETAIL(review.batch.id))}
                  >
                    <TableCell className="pl-6 font-mono text-xs font-semibold text-gray-800">
                      {review.batch.batchNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <span className="font-medium">
                        {review.batch.mbr?.product?.productName}
                      </span>
                      {review.batch.mbr?.product?.strength && (
                        <span className="ml-1 text-xs text-gray-400">
                          {review.batch.mbr.product.strength}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {review.batch.completedAt
                        ? new Date(review.batch.completedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.batch.yieldPercentage != null ? (
                        <span
                          className={
                            review.batch.yieldPercentage >= 98
                              ? "text-green-700 font-medium"
                              : review.batch.yieldPercentage >= 95
                              ? "text-yellow-700 font-medium"
                              : "text-red-700 font-medium"
                          }
                        >
                          {Number(review.batch.yieldPercentage).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.batch._count?.deviations > 0 ? (
                        <Badge
                          variant="outline"
                          className="text-xs border border-red-200 bg-red-50 text-red-600 border-transparent"
                        >
                          {review.batch._count.deviations}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StageBadge status={review.stage1Status} />
                    </TableCell>
                    <TableCell>
                      <StageBadge status={review.stage2Status} />
                    </TableCell>
                    <TableCell>
                      <StageBadge status={review.stage3Status} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border-transparent ${
                          REVIEW_STATUS_COLORS[review.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {REVIEW_STATUS_LABELS[review.status] ?? review.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={ROUTES.REVIEW_DETAIL(review.batch.id)}>
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
