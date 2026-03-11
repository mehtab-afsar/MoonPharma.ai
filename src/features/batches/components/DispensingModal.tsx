"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react"

interface BatchMaterial {
  id: string
  requiredQty: number
  tolerancePct?: number | null
  material: {
    name: string
    unit: string
  }
}

interface DispensingModalProps {
  open: boolean
  onClose: () => void
  batchId: string
  batchMaterial: BatchMaterial | null
  onSuccess: () => void
}

interface ToleranceResult {
  passed: boolean
  message: string
  variance: number
  variancePct: number
}

function checkTolerance(
  required: number,
  actual: number,
  tolerancePct: number = 2
): ToleranceResult {
  const variance = actual - required
  const variancePct = (Math.abs(variance) / required) * 100
  const passed = variancePct <= tolerancePct
  const direction = variance > 0 ? "excess" : "deficit"
  return {
    passed,
    variance,
    variancePct,
    message: passed
      ? `Within tolerance (${variancePct.toFixed(2)}% ${direction})`
      : `Out of tolerance! ${variancePct.toFixed(2)}% ${direction} — allowed ±${tolerancePct}%`,
  }
}

export function DispensingModal({
  open,
  onClose,
  batchId,
  batchMaterial,
  onSuccess,
}: DispensingModalProps) {
  const [arNumber, setArNumber] = useState("")
  const [supplierBatchNumber, setSupplierBatchNumber] = useState("")
  const [actualQty, setActualQty] = useState("")
  const [tareWeight, setTareWeight] = useState("")
  const [grossWeight, setGrossWeight] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toleranceResult, setToleranceResult] = useState<ToleranceResult | null>(null)

  function handleClose() {
    setArNumber("")
    setSupplierBatchNumber("")
    setActualQty("")
    setTareWeight("")
    setGrossWeight("")
    setToleranceResult(null)
    onClose()
  }

  function handleActualQtyChange(value: string) {
    setActualQty(value)
    if (batchMaterial && value) {
      const actual = parseFloat(value)
      if (!isNaN(actual) && actual > 0) {
        const result = checkTolerance(
          batchMaterial.requiredQty,
          actual,
          batchMaterial.tolerancePct ?? 2
        )
        setToleranceResult(result)
      } else {
        setToleranceResult(null)
      }
    } else {
      setToleranceResult(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!batchMaterial) return
    if (!actualQty) {
      toast.error("Actual quantity is required.")
      return
    }

    const actual = parseFloat(actualQty)
    if (isNaN(actual) || actual <= 0) {
      toast.error("Please enter a valid actual quantity.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        actualQty: actual,
      }
      if (arNumber) payload.arNumber = arNumber
      if (supplierBatchNumber) payload.supplierBatchNumber = supplierBatchNumber
      if (tareWeight) payload.tareWeight = parseFloat(tareWeight)
      if (grossWeight) payload.grossWeight = parseFloat(grossWeight)

      const res = await fetch(
        `/api/batches/${batchId}/materials/${batchMaterial.id}/dispense`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.message ?? "Failed to record dispensing.")
        return
      }

      toast.success("Material dispensed successfully.")
      onSuccess()
      handleClose()
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!batchMaterial) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Dispensing</DialogTitle>
          <DialogDescription>
            Record the dispensing details for{" "}
            <span className="font-semibold text-gray-900">{batchMaterial.material.name}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Qty Display */}
          <div className="rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-500">Required Quantity</p>
            <p className="text-lg font-semibold text-gray-900">
              {Number(batchMaterial.requiredQty).toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-600">
                {batchMaterial.material.unit}
              </span>
            </p>
            {batchMaterial.tolerancePct && (
              <p className="text-xs text-gray-400 mt-0.5">
                Tolerance: ±{batchMaterial.tolerancePct}%
              </p>
            )}
          </div>

          {/* Actual Quantity */}
          <div className="space-y-2">
            <Label htmlFor="actual-qty">
              Actual Quantity ({batchMaterial.material.unit}){" "}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="actual-qty"
              type="number"
              step="0.001"
              min="0"
              placeholder="Enter actual quantity dispensed"
              value={actualQty}
              onChange={(e) => handleActualQtyChange(e.target.value)}
              autoFocus
            />
            {/* Tolerance Result */}
            {toleranceResult && (
              <div
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                  toleranceResult.passed
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {toleranceResult.passed ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{toleranceResult.message}</span>
              </div>
            )}
          </div>

          {/* AR Number */}
          <div className="space-y-2">
            <Label htmlFor="ar-number">AR Number</Label>
            <Input
              id="ar-number"
              placeholder="e.g. AR/2024/001"
              value={arNumber}
              onChange={(e) => setArNumber(e.target.value)}
            />
          </div>

          {/* Supplier Batch Number */}
          <div className="space-y-2">
            <Label htmlFor="supplier-batch">Supplier Batch Number</Label>
            <Input
              id="supplier-batch"
              placeholder="e.g. SUP-BATCH-2024"
              value={supplierBatchNumber}
              onChange={(e) => setSupplierBatchNumber(e.target.value)}
            />
          </div>

          {/* Tare & Gross Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tare-weight">Tare Weight (g)</Label>
              <Input
                id="tare-weight"
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g. 125.000"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gross-weight">Gross Weight (g)</Label>
              <Input
                id="gross-weight"
                type="number"
                step="0.001"
                min="0"
                placeholder="e.g. 625.000"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Record Dispensing
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
