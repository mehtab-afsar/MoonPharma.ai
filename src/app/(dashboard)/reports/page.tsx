import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/server/db/prisma"
import { BatchStatus, DeviationStatus } from "@/generated/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  Eye,
  ArrowRight,
} from "lucide-react"

// ============================================
// DATA FETCHING
// ============================================

async function getReportsData(orgId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    // Batch counts
    totalBatches,
    batchesThisMonth,
    batchesLastMonth,
    approvedBatches,
    rejectedBatches,
    inProgressBatches,
    // Deviations
    totalDeviations,
    openDeviations,
    resolvedDeviations,
    criticalDeviations,
    majorDeviations,
    // Yield data (last 10 completed batches with yield percentage)
    recentBatchesWithYield,
    // Deviation by type
    deviationsByType,
    // Batch history (last 15)
    batchHistory,
  ] = await Promise.all([
    prisma.batch.count({ where: { orgId } }),
    prisma.batch.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
    prisma.batch.count({ where: { orgId, createdAt: { gte: lastMonth, lte: endOfLastMonth } } }),
    prisma.batch.count({ where: { orgId, status: BatchStatus.approved } }),
    prisma.batch.count({ where: { orgId, status: BatchStatus.rejected } }),
    prisma.batch.count({ where: { orgId, status: BatchStatus.in_progress } }),
    prisma.deviation.count({ where: { orgId } }),
    prisma.deviation.count({ where: { orgId, status: { in: [DeviationStatus.open, DeviationStatus.under_investigation] } } }),
    prisma.deviation.count({ where: { orgId, status: { in: [DeviationStatus.resolved, DeviationStatus.closed] } } }),
    prisma.deviation.count({ where: { orgId, severity: "critical" } }),
    prisma.deviation.count({ where: { orgId, severity: "major" } }),
    prisma.batch.findMany({
      where: { orgId, yieldPercentage: { not: null }, status: { in: [BatchStatus.completed, BatchStatus.approved] } },
      select: {
        id: true,
        batchNumber: true,
        yieldPercentage: true,
        manufacturingDate: true,
        mbr: { select: { product: { select: { productName: true } } } },
      },
      orderBy: { manufacturingDate: "desc" },
      take: 10,
    }),
    prisma.deviation.groupBy({
      by: ["deviationType"],
      where: { orgId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.batch.findMany({
      where: { orgId },
      include: {
        mbr: { include: { product: { select: { productName: true, strength: true } } } },
        initiatedBy: { select: { fullName: true } },
        _count: { select: { deviations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ])

  const releaseRate = totalBatches > 0 ? Math.round((approvedBatches / totalBatches) * 100) : 0
  const batchGrowth = batchesLastMonth > 0
    ? Math.round(((batchesThisMonth - batchesLastMonth) / batchesLastMonth) * 100)
    : batchesThisMonth > 0 ? 100 : 0

  const avgYield =
    recentBatchesWithYield.length > 0
      ? (
          recentBatchesWithYield.reduce((sum, b) => sum + Number(b.yieldPercentage ?? 0), 0) /
          recentBatchesWithYield.length
        ).toFixed(1)
      : null

  return {
    totalBatches,
    batchesThisMonth,
    batchesLastMonth,
    batchGrowth,
    approvedBatches,
    rejectedBatches,
    inProgressBatches,
    releaseRate,
    totalDeviations,
    openDeviations,
    resolvedDeviations,
    criticalDeviations,
    majorDeviations,
    avgYield,
    recentBatchesWithYield,
    deviationsByType,
    batchHistory,
  }
}

// ============================================
// HELPERS
// ============================================

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(d))
}

function yieldPct(pct: unknown): string {
  const p = Number(pct)
  if (!p) return "—"
  return p.toFixed(1) + "%"
}

function yieldColor(pct: unknown): string {
  const p = Number(pct)
  if (!p) return "text-gray-400"
  if (p >= 97) return "text-gray-900 font-semibold"
  if (p >= 92) return "text-gray-600"
  return "text-gray-400"
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Planned", in_progress: "In Progress", completed: "Completed",
  under_review: "Under Review", approved: "Approved", rejected: "Rejected", on_hold: "On Hold",
}

const STATUS_STYLES: Record<string, string> = {
  approved:     "bg-gray-900 text-white border-gray-900",
  rejected:     "bg-white text-gray-400 border-gray-300",
  in_progress:  "bg-gray-100 text-gray-700 border-gray-200",
  completed:    "bg-gray-50 text-gray-700 border-gray-200",
  under_review: "bg-gray-200 text-gray-700 border-gray-300",
  on_hold:      "bg-white text-gray-400 border-gray-200",
}

// Bar chart (pure CSS/SVG)
function MiniBarChart({ data, max }: { data: { label: string; value: number }[]; max: number }) {
  return (
    <div className="space-y-2 mt-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-28 text-xs text-gray-500 truncate capitalize">
            {d.label.replace(/_/g, " ")}
          </div>
          <div className="flex-1 h-5 bg-gray-100 rounded-sm overflow-hidden">
            <div
              className="h-full bg-gray-900 rounded-sm transition-all"
              style={{ width: `${max > 0 ? (d.value / max) * 100 : 0}%` }}
            />
          </div>
          <div className="w-7 text-xs font-mono text-gray-700 text-right">{d.value}</div>
        </div>
      ))}
    </div>
  )
}

// ============================================
// PAGE
// ============================================

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const d = await getReportsData(session.user.orgId)

  const maxDevType = Math.max(...d.deviationsByType.map((t) => t._count.id), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Batch analytics, yield trends, deviation summary, and release metrics.
          </p>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <Package className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xs font-medium text-gray-500">Total Batches</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.totalBatches}</p>
            <div className="flex items-center gap-1 mt-1">
              {d.batchGrowth >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-gray-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-gray-400" />
              )}
              <p className="text-xs text-gray-500">
                {d.batchGrowth >= 0 ? "+" : ""}{d.batchGrowth}% vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xs font-medium text-gray-500">Release Rate</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.releaseRate}%</p>
            <p className="text-xs text-gray-500 mt-1">
              {d.approvedBatches} approved · {d.rejectedBatches} rejected
            </p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xs font-medium text-gray-500">Avg Yield</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {d.avgYield ? `${d.avgYield}%` : "—"}
            </p>
            <p className="text-xs text-gray-500 mt-1">last {d.recentBatchesWithYield.length} batches</p>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-gray-600" />
              </div>
              <p className="text-xs font-medium text-gray-500">Open Deviations</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{d.openDeviations}</p>
            <p className="text-xs text-gray-500 mt-1">
              {d.criticalDeviations} critical · {d.majorDeviations} major
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Middle Row: Deviation types + Yield table ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Deviation by type */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Deviations by Type</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              {d.totalDeviations} total · {d.resolvedDeviations} resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            {d.deviationsByType.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No deviations recorded yet</p>
            ) : (
              <MiniBarChart
                data={d.deviationsByType.map((t) => ({ label: t.deviationType, value: t._count.id }))}
                max={maxDevType}
              />
            )}
          </CardContent>
        </Card>

        {/* Yield table */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Recent Batch Yields</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Last {d.recentBatchesWithYield.length} completed batches
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {d.recentBatchesWithYield.length === 0 ? (
              <p className="text-sm text-gray-400 py-8 text-center px-6">No yield data yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="pl-6 py-2 text-left text-xs font-medium text-gray-500">Batch</th>
                    <th className="py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="pr-6 py-2 text-right text-xs font-medium text-gray-500">Yield %</th>
                  </tr>
                </thead>
                <tbody>
                  {d.recentBatchesWithYield.map((b) => (
                    <tr key={b.id} className="border-b border-gray-50 last:border-0">
                      <td className="pl-6 py-2 font-mono text-xs text-gray-700">{b.batchNumber}</td>
                      <td className="py-2 text-xs text-gray-600 truncate max-w-[140px]">
                        {b.mbr?.product?.productName ?? "—"}
                      </td>
                      <td className={`pr-6 py-2 text-right text-xs ${yieldColor(b.yieldPercentage)}`}>
                        {yieldPct(b.yieldPercentage)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── This month summary ── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{d.batchesThisMonth}</p>
              <p className="text-xs text-gray-500">Batches this month</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{d.approvedBatches}</p>
              <p className="text-xs text-gray-500">Batches approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{d.inProgressBatches}</p>
              <p className="text-xs text-gray-500">Currently in progress</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Batch History Table ── */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">Batch History</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Last {d.batchHistory.length} batches
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500">
              <Link href="/batches">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {d.batchHistory.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No batches recorded yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">Batch No.</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Product</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Mfg Date</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Initiated By</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Deviations</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.batchHistory.map((b) => (
                  <TableRow key={b.id} className="border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                      {b.batchNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {b.mbr?.product?.productName ?? "—"}
                      {b.mbr?.product?.strength && (
                        <span className="text-xs text-gray-400 ml-1">{b.mbr.product.strength}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(b.manufacturingDate)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {b.initiatedBy?.fullName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${b._count.deviations > 0 ? "text-gray-900" : "text-gray-400"}`}>
                        {b._count.deviations}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[b.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={`/batches/${b.id}`}>
                          <Eye className="h-3.5 w-3.5" />
                          View
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
