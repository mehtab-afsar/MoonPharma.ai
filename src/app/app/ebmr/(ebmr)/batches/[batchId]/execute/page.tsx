"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  Package,
  Layers,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Flag,
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "@/shared/constants/pharma.constants"
import { BatchStatusBadge } from "@/features/batches/components/BatchStatusBadge"
import { DispensingModal } from "@/features/batches/components/DispensingModal"
import { StepExecutionPanel } from "@/features/batches/components/StepExecutionPanel"

type CurrentView = "dispensing" | "steps" | "complete_batch"

interface BatchMaterial {
  id: string
  status: string
  requiredQty: number
  actualQty: number | null
  tolerancePct?: number | null
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

interface Parameter {
  id: string
  parameterName: string
  parameterType: string
  unit?: string | null
  minValue?: number | null
  maxValue?: number | null
  expectedValue?: string | null
  options?: string | null
  isRequired: boolean
  recordedValue?: string | null
}

interface IPCCheck {
  id: string
  checkName: string
  checkType: string
  specification: string
  unit?: string | null
  minValue?: number | null
  maxValue?: number | null
  recordedValue?: string | null
  passed?: boolean | null
}

interface BatchStep {
  id: string
  stepNumber: number
  status: string
  startedAt: string | null
  completedAt: string | null
  mbrStep: {
    id: string
    stepName: string
    stage: string
    instructions: string
    minTemp?: number | null
    maxTemp?: number | null
    minHumidity?: number | null
    maxHumidity?: number | null
    minPressure?: number | null
    maxPressure?: number | null
    parameters: Parameter[]
    ipcChecks: IPCCheck[]
    equipment: Array<{
      id: string
      equipment: {
        name: string
        equipmentCode: string
      }
    }>
  }
}

interface BatchDetail {
  id: string
  batchNumber: string
  status: string
  manufacturingDate: string | null
  mbr: {
    mbrCode: string
    product: {
      productName: string
      strength?: string | null
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

async function fetchBatchDetail(batchId: string): Promise<BatchDetail | null> {
  const res = await fetch(`/api/batches/${batchId}`)
  if (!res.ok) return null
  const json = await res.json()
  return json.data ?? json ?? null
}

function StepSidebarItem({
  step,
  isActive,
  onClick,
}: {
  step: BatchStep
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {step.status === "completed" ? (
        <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? "text-gray-300" : "text-gray-500"}`} />
      ) : step.status === "in_progress" ? (
        <Clock className={`h-4 w-4 shrink-0 animate-pulse ${isActive ? "text-gray-300" : "text-gray-500"}`} />
      ) : (
        <Circle className={`h-4 w-4 shrink-0 ${isActive ? "text-gray-500" : "text-gray-300"}`} />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-xs ${isActive ? "text-gray-400" : "text-gray-400"}`}>Step {step.stepNumber}</p>
        <p className={`truncate text-sm font-medium ${isActive ? "text-white" : "text-gray-700"}`}>
          {step.mbrStep?.stepName}
        </p>
      </div>
    </button>
  )
}

function CompleteBatchPanel({
  batchId,
  onComplete,
}: {
  batchId: string
  onComplete: () => void
}) {
  const router = useRouter()
  const [actualYieldValue, setActualYieldValue] = useState("")
  const [actualYieldUnit, setActualYieldUnit] = useState("kg")
  const [theoreticalYield, setTheoreticalYield] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleComplete() {
    if (!actualYieldValue || !theoreticalYield) {
      toast.error("Enter actual yield and theoretical yield to complete the batch.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/batches/${batchId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualYieldValue: parseFloat(actualYieldValue),
          actualYieldUnit,
          theoreticalYield: parseFloat(theoreticalYield),
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "Failed to complete batch.")
        return
      }

      const yieldPct = result.data?.yieldPercentage
      const pctStr = yieldPct != null ? ` (${Number(yieldPct).toFixed(1)}% yield)` : ""
      toast.success(`Batch completed${pctStr}. Sending to QA review.`)
      onComplete()
      router.push(ROUTES.BATCH_DETAIL(batchId))
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Complete Batch</h2>
        <p className="text-sm text-gray-500">
          All manufacturing steps are complete. Enter final yield data to close this batch and send it to QA review.
        </p>
      </div>

      <Card className="border border-gray-900 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Final Yield Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="actualYield">
                Actual Yield <span className="text-red-500">*</span>
              </Label>
              <Input
                id="actualYield"
                type="number"
                step="0.001"
                placeholder="e.g. 48.5"
                value={actualYieldValue}
                onChange={(e) => setActualYieldValue(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={actualYieldUnit} onValueChange={setActualYieldUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["kg", "g", "mg", "L", "mL", "units", "tablets", "capsules", "vials"].map(
                    (u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="theoreticalYield">
              Theoretical Yield ({actualYieldUnit}) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="theoreticalYield"
              type="number"
              step="0.001"
              placeholder="e.g. 50.0"
              value={theoreticalYield}
              onChange={(e) => setTheoreticalYield(e.target.value)}
            />
            <p className="text-xs text-gray-400">
              From the MBR. Used to calculate yield percentage.
            </p>
          </div>

          {/* Live yield preview */}
          {actualYieldValue && theoreticalYield && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500">Calculated Yield</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900">
                {((parseFloat(actualYieldValue) / parseFloat(theoreticalYield)) * 100).toFixed(1)}%
              </p>
            </div>
          )}

          <Button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="w-full gap-2 bg-black text-white hover:bg-gray-800"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Completing Batch...</>
            ) : (
              <><Flag className="h-4 w-4" /> Complete Batch & Send to QA</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BatchExecutePage() {
  const params = useParams()
  const batchId = params.batchId as string

  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<CurrentView>("dispensing")
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)
  const [dispensingMaterial, setDispensingMaterial] = useState<BatchMaterial | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyingMaterialId, setVerifyingMaterialId] = useState<string | null>(null)

  const loadBatch = useCallback(async () => {
    const data = await fetchBatchDetail(batchId)
    setBatch(data)
    setLoading(false)
  }, [batchId])

  useEffect(() => {
    loadBatch()
  }, [loadBatch])

  // Auto-navigate to first in_progress or pending step
  useEffect(() => {
    if (!batch) return
    if (currentView === "steps") {
      const inProgressIndex = batch.batchSteps.findIndex((s) => s.status === "in_progress")
      if (inProgressIndex >= 0) {
        setSelectedStepIndex(inProgressIndex)
      } else {
        const pendingIndex = batch.batchSteps.findIndex((s) => s.status === "pending")
        if (pendingIndex >= 0) setSelectedStepIndex(pendingIndex)
      }
    }
  }, [currentView, batch?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleVerifyMaterial(materialId: string) {
    setVerifyingMaterialId(materialId)
    setIsVerifying(true)
    try {
      const res = await fetch(`/api/batches/${batchId}/materials/${materialId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "Failed to verify material.")
        return
      }
      toast.success("Material verified.")
      await loadBatch()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsVerifying(false)
      setVerifyingMaterialId(null)
    }
  }

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

  const allMaterialsReady = batch.batchMaterials.every((m) => m.status === "verified")
  const dispensedCount = batch.batchMaterials.filter((m) => m.status !== "pending").length
  const verifiedCount = batch.batchMaterials.filter((m) => m.status === "verified").length
  const currentStep = batch.batchSteps[selectedStepIndex]
  const completedSteps = batch.batchSteps.filter((s) => s.status === "completed").length
  const allStepsComplete =
    batch.batchSteps.length > 0 && completedSteps === batch.batchSteps.length

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden">
      {/* Batch Header Bar */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-gray-600">
              <Link href={ROUTES.BATCH_DETAIL(batchId)}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-gray-900">
                {batch.batchNumber}
              </span>
              <span className="text-sm text-gray-500">
                {batch.mbr?.product?.productName}
                {batch.mbr?.product?.strength && ` · ${batch.mbr.product.strength}`}
              </span>
              <Badge
                variant="outline"
                className={`text-xs border ${
                  BATCH_STATUS_COLORS[batch.status as keyof typeof BATCH_STATUS_COLORS] ?? "bg-gray-100 text-gray-600"
                } border-transparent`}
              >
                {BATCH_STATUS_LABELS[batch.status as keyof typeof BATCH_STATUS_LABELS] ?? batch.status}
              </Badge>
            </div>
          </div>

          {/* Phase Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setCurrentView("dispensing")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === "dispensing"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              Dispensing
              <span className={`text-xs ${currentView === "dispensing" ? "text-gray-700" : "text-gray-400"}`}>
                {verifiedCount}/{batch.batchMaterials.length}
              </span>
            </button>
            <button
              onClick={() => setCurrentView("steps")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                currentView === "steps"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Steps
              <span className={`text-xs ${currentView === "steps" ? "text-gray-700" : "text-gray-400"}`}>
                {completedSteps}/{batch.batchSteps.length}
              </span>
            </button>
            {allStepsComplete && batch.status !== "completed" && (
              <button
                onClick={() => setCurrentView("complete_batch")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentView === "complete_batch"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                Complete Batch
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Steps Sidebar (only in steps view) */}
        {currentView === "steps" && (
          <div className="w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50 p-3">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Manufacturing Steps
            </p>
            <div className="space-y-0.5">
              {batch.batchSteps.map((step, index) => (
                <StepSidebarItem
                  key={step.id}
                  step={step}
                  isActive={selectedStepIndex === index}
                  onClick={() => setSelectedStepIndex(index)}
                />
              ))}
            </div>

            {!allMaterialsReady && (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-600">
                <AlertTriangle className="mb-1 h-3.5 w-3.5" />
                Complete dispensing before starting steps.
              </div>
            )}

            {allStepsComplete && (
              <button
                onClick={() => setCurrentView("complete_batch")}
                className="mt-3 w-full rounded-md bg-gray-900 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                Complete Batch →
              </button>
            )}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Dispensing View */}
          {currentView === "dispensing" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Materials Dispensing</h2>
                  <p className="text-sm text-gray-500">
                    Dispense and verify all materials before proceeding to manufacturing steps.
                  </p>
                </div>
                {allMaterialsReady && (
                  <Button
                    onClick={() => setCurrentView("steps")}
                    className="gap-2 bg-black text-white hover:bg-gray-800"
                  >
                    <Layers className="h-4 w-4" />
                    Proceed to Steps
                  </Button>
                )}
              </div>

              {/* Progress */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                  <span className="text-gray-600">
                    Dispensed: <span className="font-semibold">{dispensedCount}</span>/{batch.batchMaterials.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-gray-900" />
                  <span className="text-gray-600">
                    Verified: <span className="font-semibold">{verifiedCount}</span>/{batch.batchMaterials.length}
                  </span>
                </div>
              </div>

              {batch.batchMaterials.length === 0 ? (
                <Card className="border border-gray-200">
                  <CardContent className="py-10 text-center text-sm text-gray-400">
                    No materials defined for this batch.
                  </CardContent>
                </Card>
              ) : (
                <Card className="border border-gray-200 shadow-sm">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-100 bg-gray-50/50">
                          <TableHead className="pl-6 text-xs font-medium text-gray-500">Material</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500">Required Qty</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500">Actual Qty</TableHead>
                          <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                          <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">Action</TableHead>
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
                              {mat.actualQty != null
                                ? `${Number(mat.actualQty).toLocaleString()} ${mat.material.unit}`
                                : <span className="text-gray-300">—</span>}
                            </TableCell>
                            <TableCell>
                              <BatchStatusBadge status={mat.status} type="material" />
                            </TableCell>
                            <TableCell className="pr-6 text-right">
                              {mat.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  onClick={() => setDispensingMaterial(mat)}
                                >
                                  <Package className="h-3.5 w-3.5" />
                                  Dispense
                                </Button>
                              )}
                              {mat.status === "dispensed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5"
                                  onClick={() => handleVerifyMaterial(mat.id)}
                                  disabled={isVerifying && verifyingMaterialId === mat.id}
                                >
                                  {isVerifying && verifyingMaterialId === mat.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  )}
                                  Verify
                                </Button>
                              )}
                              {mat.status === "verified" && (
                                <div className="flex items-center justify-end gap-1.5 text-xs text-gray-600">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Verified
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Steps View */}
          {currentView === "steps" && (
            <div>
              {batch.batchSteps.length === 0 ? (
                <Card className="border border-gray-200">
                  <CardContent className="py-10 text-center text-sm text-gray-400">
                    No steps defined for this batch.
                  </CardContent>
                </Card>
              ) : currentStep ? (
                <StepExecutionPanel
                  key={currentStep.id}
                  step={currentStep}
                  batchId={batchId}
                  onStepUpdate={async () => {
                    await loadBatch()
                  }}
                />
              ) : (
                <div className="py-10 text-center text-sm text-gray-400">
                  Select a step from the sidebar.
                </div>
              )}
            </div>
          )}

          {/* Complete Batch View */}
          {currentView === "complete_batch" && (
            <CompleteBatchPanel batchId={batchId} onComplete={loadBatch} />
          )}
        </div>
      </div>

      {/* Dispensing Modal */}
      <DispensingModal
        open={!!dispensingMaterial}
        onClose={() => setDispensingMaterial(null)}
        batchId={batchId}
        batchMaterial={dispensingMaterial}
        onSuccess={loadBatch}
      />
    </div>
  )
}
