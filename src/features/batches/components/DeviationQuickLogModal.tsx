"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DeviationQuickLogModalProps {
  open: boolean
  onClose: () => void
  batchId: string
  batchStepId: string
  stepName: string
  onLogged: () => void
}

const CATEGORIES = [
  { value: "process", label: "Process" },
  { value: "equipment", label: "Equipment" },
  { value: "material", label: "Material" },
  { value: "environmental", label: "Environmental" },
]

const SEVERITIES = [
  { value: "minor", label: "Minor" },
  { value: "major", label: "Major" },
  { value: "critical", label: "Critical" },
]

export function DeviationQuickLogModal({
  open,
  onClose,
  batchId,
  batchStepId,
  stepName,
  onLogged,
}: DeviationQuickLogModalProps) {
  const [category, setCategory] = useState("process")
  const [severity, setSeverity] = useState("minor")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!open) return null

  async function handleSubmit() {
    if (!description.trim()) {
      toast.error("Description is required.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/deviations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          batchStepId,
          deviationType: "unplanned",
          category,
          severity,
          description: description.trim(),
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "Failed to log deviation.")
        return
      }
      toast.success(`Deviation ${result.data?.deviationNumber ?? ""} logged.`)
      setDescription("")
      setCategory("process")
      setSeverity("minor")
      onLogged()
      onClose()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mx-4">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-4.5 w-4.5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Log Deviation</h2>
            <p className="text-xs text-gray-500 mt-0.5">Step: {stepName}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category *</Label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Severity *</Label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {SEVERITIES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description *</Label>
            <Textarea
              rows={3}
              placeholder="Describe what deviated from the procedure..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1" disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
              Log Deviation
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
