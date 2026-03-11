"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Loader2 } from "lucide-react"

// ============================================
// TYPES
// ============================================

interface RaiseDeviationModalProps {
  batchId: string
  batchStepId?: string
  isOpen: boolean
  onClose: () => void
  onCreated: (deviation: CreatedDeviation) => void
}

interface CreatedDeviation {
  id: string
  deviationNumber: string
  severity: string
  status: string
}

interface FormState {
  deviationType: string
  category: string
  severity: string
  description: string
  rootCause: string
  impactAssessment: string
}

// ============================================
// CONSTANTS
// ============================================

const DEVIATION_TYPE_OPTIONS = [
  { value: "planned", label: "Planned" },
  { value: "unplanned", label: "Unplanned" },
] as const

const DEVIATION_CATEGORY_OPTIONS = [
  { value: "process", label: "Process" },
  { value: "equipment", label: "Equipment" },
  { value: "material", label: "Material" },
  { value: "environmental", label: "Environmental" },
] as const

const DEVIATION_SEVERITY_OPTIONS = [
  { value: "minor", label: "Minor", description: "Low risk, minimal impact on product quality" },
  { value: "major", label: "Major", description: "Moderate risk, potential impact on product quality" },
  { value: "critical", label: "Critical", description: "High risk, significant impact on product safety/quality" },
] as const

const SEVERITY_COLORS: Record<string, string> = {
  minor: "text-yellow-700",
  major: "text-orange-700",
  critical: "text-red-700",
}

// ============================================
// INITIAL FORM STATE
// ============================================

const INITIAL_FORM: FormState = {
  deviationType: "",
  category: "",
  severity: "",
  description: "",
  rootCause: "",
  impactAssessment: "",
}

// ============================================
// COMPONENT
// ============================================

export function RaiseDeviationModal({
  batchId,
  batchStepId,
  isOpen,
  onClose,
  onCreated,
}: RaiseDeviationModalProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (isSubmitting) return
    setForm(INITIAL_FORM)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.deviationType) {
      toast.error("Please select a deviation type")
      return
    }
    if (!form.category) {
      toast.error("Please select a category")
      return
    }
    if (!form.severity) {
      toast.error("Please select a severity level")
      return
    }
    if (!form.description.trim()) {
      toast.error("Please provide a description")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/deviations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          batchStepId,
          deviationType: form.deviationType,
          category: form.category,
          severity: form.severity,
          description: form.description.trim(),
          rootCause: form.rootCause.trim() || undefined,
          impactAssessment: form.impactAssessment.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message ?? "Failed to raise deviation")
      }

      const json = await res.json()
      const deviation: CreatedDeviation = json.data

      toast.success(`Deviation ${deviation.deviationNumber} raised successfully`)
      setForm(INITIAL_FORM)
      onCreated(deviation)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to raise deviation")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedSeverity = DEVIATION_SEVERITY_OPTIONS.find((s) => s.value === form.severity)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-red-50 p-1.5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <DialogTitle className="text-base">Raise Deviation</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-gray-500">
            Record a deviation from the approved manufacturing procedure.
            {batchStepId && " This deviation will be linked to the current step."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Deviation Type */}
          <div className="space-y-1.5">
            <Label htmlFor="deviationType" className="text-xs font-medium text-gray-700">
              Deviation Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.deviationType}
              onValueChange={(value) => setForm((prev) => ({ ...prev, deviationType: value }))}
            >
              <SelectTrigger id="deviationType" className="h-9 text-sm">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {DEVIATION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="category" className="h-9 text-sm">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {DEVIATION_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <Label htmlFor="severity" className="text-xs font-medium text-gray-700">
              Severity <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.severity}
              onValueChange={(value) => setForm((prev) => ({ ...prev, severity: value }))}
            >
              <SelectTrigger id="severity" className="h-9 text-sm">
                <SelectValue placeholder="Select severity..." />
              </SelectTrigger>
              <SelectContent>
                {DEVIATION_SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    <span className={`font-medium ${SEVERITY_COLORS[option.value]}`}>
                      {option.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeverity && (
              <p className={`text-xs ${SEVERITY_COLORS[selectedSeverity.value]}`}>
                {selectedSeverity.description}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the deviation in detail — what happened, when, and where..."
              rows={4}
              className="text-sm resize-none"
              required
            />
          </div>

          {/* Root Cause (optional at time of raising) */}
          <div className="space-y-1.5">
            <Label htmlFor="rootCause" className="text-xs font-medium text-gray-700">
              Initial Root Cause Assessment{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="rootCause"
              value={form.rootCause}
              onChange={(e) => setForm((prev) => ({ ...prev, rootCause: e.target.value }))}
              placeholder="If known, describe the likely root cause..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Impact Assessment (optional) */}
          <div className="space-y-1.5">
            <Label htmlFor="impactAssessment" className="text-xs font-medium text-gray-700">
              Impact Assessment{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="impactAssessment"
              value={form.impactAssessment}
              onChange={(e) => setForm((prev) => ({ ...prev, impactAssessment: e.target.value }))}
              placeholder="Describe the potential impact on product quality or safety..."
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              Raise Deviation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
