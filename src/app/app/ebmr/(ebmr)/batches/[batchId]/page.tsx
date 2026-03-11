"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Play, CheckCircle2, Clock, Circle, Loader2, AlertTriangle, Download } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "@/shared/constants/pharma.constants"
import { BatchStatusBadge } from "@/features/batches/components/BatchStatusBadge"

interface BatchMaterial {
  id: string
  status: string
  requiredQty: number
  actualQty: number | null
  material: {
    name: string
    unit: string
    materialType: string
  }
  dispensedBy?: {
    name: string | null
    email: string
  } | null
  verifiedBy?: {
    name: string | null
    email: string
  } | null
}

interface BatchStep {
  id: string
  stepNumber: number
  status: string
  startedAt: string | null
  completedAt: string | null
  mbrStep: {
    stepName: string
    stage: string
    instructions: string
  }
}

interface BatchDetail {
  id: string
  batchNumber: string
  status: string
  manufacturingDate: string | null
  expiryDate: string | null
  actualYield: number | null
  theoreticalYield: number | null
  yieldUnit: string | null
  createdAt: string
  mbr: {
    mbrCode: string
    version: number
    batchSizeValue: number
    batchSizeUnit: string
    product: {
      productName: string
      strength?: string | null
      dosageForm?: string | null
    }
  }
  initiatedBy: {
    name: string | null
    email: string
  }
  batchMaterials: BatchMaterial[]
  batchSteps: BatchStep[]
  _count?: {
    deviations: number
  }
}

async function fetchBatch(batchId: string): Promise<BatchDetail | null> {
  const res = await fetch(`/api/batches/${batchId}`)
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? json ?? null
}

function StepStatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-green-500" />
  if (status === "in_progress") return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
  return <Circle className="h-4 w-4 text-gray-300" />
}

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.batchId as string

  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBatch(batchId)
      .then(setBatch)
      .finally(() => setLoading(false))
  }, [batchId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">Batch not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.BATCHES}>Back to Batches</Link>
        </Button>
      </div>
    )
  }

  const dispensedCount = batch.batchMaterials.filter((m) => m.status !== "pending").length
  const completedSteps = batch.batchSteps.filter((s) => s.status === "completed").length
  const yieldPercentage =
    batch.actualYield && batch.theoreticalYield
      ? ((batch.actualYield / batch.theoreticalYield) * 100).toFixed(1)
      : null

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-gray-600">
          <Link href={ROUTES.BATCHES}>
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900 font-mono">
              {batch.batchNumber}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs border ${
                BATCH_STATUS_COLORS[batch.status as keyof typeof BATCH_STATUS_COLORS] ?? "bg-gray-100 text-gray-600"
              } border-transparent`}
            >
              {BATCH_STATUS_LABELS[batch.status as keyof typeof BATCH_STATUS_LABELS] ?? batch.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {batch.mbr?.product?.productName}
            {batch.mbr?.product?.strength && ` · ${batch.mbr.product.strength}`}
            {" · "}
            <span className="font-mono">{batch.mbr?.mbrCode}</span> v{batch.mbr?.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/batches/${batchId}/export`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </a>
          {batch.status === "in_progress" && (
            <Button
              onClick={() => router.push(ROUTES.BATCH_EXECUTE(batch.id))}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Continue Execution
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards */}
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
            <p className="text-xs text-gray-500">Expiry Date</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch.expiryDate
                ? new Date(batch.expiryDate).toLocaleDateString("en-IN", {
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
            <p className="text-xs text-gray-500">Initiated By</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch.initiatedBy?.name ?? batch.initiatedBy?.email ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500">Deviations</p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {batch._count?.deviations ?? 0}
              {(batch._count?.deviations ?? 0) > 0 && (
                <span className="ml-2 text-xs text-red-600">(Requires attention)</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yield Info */}
      {(batch.actualYield || batch.theoreticalYield) && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Yield Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500">Theoretical Yield</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {batch.theoreticalYield
                  ? `${Number(batch.theoreticalYield).toLocaleString()} ${batch.yieldUnit ?? ""}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Actual Yield</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {batch.actualYield
                  ? `${Number(batch.actualYield).toLocaleString()} ${batch.yieldUnit ?? ""}`
                  : "—"}
              </p>
            </div>
            {yieldPercentage && (
              <div>
                <p className="text-xs text-gray-500">Yield %</p>
                <p className={`mt-1 text-lg font-semibold ${
                  Number(yieldPercentage) >= 98 ? "text-green-700" :
                  Number(yieldPercentage) >= 95 ? "text-yellow-700" : "text-red-700"
                }`}>
                  {yieldPercentage}%
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Materials Dispensing Status */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Materials Dispensing
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {dispensedCount} of {batch.batchMaterials.length} material{batch.batchMaterials.length !== 1 ? "s" : ""} dispensed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {batch.batchMaterials.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No materials defined for this batch.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">Material</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Required Qty</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Actual Qty</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="pr-6 text-xs font-medium text-gray-500">Dispensed By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batch.batchMaterials.map((mat) => (
                  <TableRow key={mat.id} className="border-gray-100">
                    <TableCell className="pl-6 font-medium text-sm text-gray-900">
                      {mat.material.name}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 capitalize">
                      {mat.material.materialType}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {Number(mat.requiredQty).toLocaleString()} {mat.material.unit}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {mat.actualQty
                        ? `${Number(mat.actualQty).toLocaleString()} ${mat.material.unit}`
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <BatchStatusBadge status={mat.status} type="material" />
                    </TableCell>
                    <TableCell className="pr-6 text-sm text-gray-600">
                      {mat.dispensedBy?.name ?? mat.dispensedBy?.email ?? <span className="text-gray-300">—</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Steps Progress */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            Manufacturing Steps
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {completedSteps} of {batch.batchSteps.length} step{batch.batchSteps.length !== 1 ? "s" : ""} completed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {batch.batchSteps.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">No steps defined for this batch.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {batch.batchSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-4 px-6 py-3">
                  <StepStatusIcon status={step.status} />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-mono text-gray-400 shrink-0">
                      Step {step.stepNumber}
                    </span>
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {step.mbrStep?.stepName}
                    </span>
                    {step.mbrStep?.stage && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {step.mbrStep.stage}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 shrink-0">
                    {step.startedAt && (
                      <span>
                        Started: {new Date(step.startedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {step.completedAt && (
                      <span>
                        Done: {new Date(step.completedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    <BatchStatusBadge status={step.status} type="step" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
