"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Plus, Trash2, Loader2, ChevronLeft, ListOrdered, ChevronDown, ChevronUp, Download, Sparkles,
} from "lucide-react"
import { MANUFACTURING_STAGES, PARAMETER_TYPES } from "@/shared/constants/pharma.constants"

// ---------- Types ----------

interface MBRStepParameter {
  id: string
  parameterName: string
  parameterType: string
  unit?: string
  targetValue?: string
  minValue?: number
  maxValue?: number
  isCritical: boolean
  sequenceOrder: number
}

interface MBRIPCCheck {
  id: string
  checkName: string
  checkType: string
  unit?: string
  specification?: string
  targetValue?: number
  minValue?: number
  maxValue?: number
  frequency?: string
  sampleSize?: string
  isCritical: boolean
  sequenceOrder: number
}

interface MBRStep {
  id: string
  stepNumber: number
  stepName: string
  stage?: string
  instructions: string
  equipmentType?: string
  estimatedDurationMinutes?: number
  requiresLineClearance: boolean
  requiresEnvironmentalCheck: boolean
  envTempMin?: number
  envTempMax?: number
  envHumidityMin?: number
  envHumidityMax?: number
  parameters: MBRStepParameter[]
  ipcChecks: MBRIPCCheck[]
}

interface StepFormValues {
  stepName: string
  stage: string
  instructions: string
  equipmentType: string
  estimatedDurationMinutes: string
  requiresLineClearance: boolean
  requiresEnvironmentalCheck: boolean
  envTempMin: string
  envTempMax: string
  envHumidityMin: string
  envHumidityMax: string
}

interface ParameterFormValues {
  parameterName: string
  parameterType: string
  unit: string
  targetValue: string
  minValue: string
  maxValue: string
  isCritical: boolean
  sequenceOrder: string
}

interface IPCFormValues {
  checkName: string
  checkType: string
  unit: string
  specification: string
  targetValue: string
  minValue: string
  maxValue: string
  frequency: string
  sampleSize: string
  isCritical: boolean
  sequenceOrder: string
}

interface Props {
  mbrId: string
  onComplete: (count: number) => void
  onBack: () => void
}

// ---------- Sub-form: Add Parameter ----------

function AddParameterForm({
  stepId,
  mbrId,
  existingCount,
  onAdded,
  onCancel,
}: {
  stepId: string
  mbrId: string
  existingCount: number
  onAdded: (param: MBRStepParameter) => void
  onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<ParameterFormValues>({
    defaultValues: {
      parameterType: "numeric",
      isCritical: false,
      sequenceOrder: String(existingCount + 1),
    },
  })
  const isCritical = watch("isCritical")

  async function onSubmit(values: ParameterFormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/${stepId}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parameterName: values.parameterName,
          parameterType: values.parameterType,
          unit: values.unit || undefined,
          targetValue: values.targetValue || undefined,
          minValue: values.minValue !== "" ? Number(values.minValue) : undefined,
          maxValue: values.maxValue !== "" ? Number(values.maxValue) : undefined,
          isCritical: values.isCritical,
          sequenceOrder: Number(values.sequenceOrder),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message ?? "Failed to add parameter"); return }
      onAdded(json.data)
      toast.success("Parameter added")
      reset()
    } catch { toast.error("Unexpected error") }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Add Process Parameter</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Parameter Name *</Label>
          <Input className="h-8 text-xs" placeholder="e.g. Mixing Speed" {...register("parameterName", { required: true })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select defaultValue="numeric" onValueChange={(v) => setValue("parameterType", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PARAMETER_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit</Label>
          <Input className="h-8 text-xs" placeholder="rpm, °C..." {...register("unit")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Target Value</Label>
          <Input className="h-8 text-xs" placeholder="e.g. 500" {...register("targetValue")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Min Value</Label>
          <Input type="number" step="any" className="h-8 text-xs" {...register("minValue")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Value</Label>
          <Input type="number" step="any" className="h-8 text-xs" {...register("maxValue")} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`pc-${stepId}`} checked={isCritical} onCheckedChange={(c) => setValue("isCritical", Boolean(c))} />
        <Label htmlFor={`pc-${stepId}`} className="text-xs cursor-pointer">Critical parameter</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" className="h-7 text-xs gap-1" disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 animate-spin" />} Add
        </Button>
      </div>
    </form>
  )
}

// ---------- Sub-form: Add IPC Check ----------

function AddIPCForm({
  stepId,
  mbrId,
  existingCount,
  onAdded,
  onCancel,
}: {
  stepId: string
  mbrId: string
  existingCount: number
  onAdded: (check: MBRIPCCheck) => void
  onCancel: () => void
}) {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, setValue, watch, reset } = useForm<IPCFormValues>({
    defaultValues: {
      checkType: "numeric",
      isCritical: false,
      sequenceOrder: String(existingCount + 1),
    },
  })
  const isCritical = watch("isCritical")

  async function onSubmit(values: IPCFormValues) {
    setSaving(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/${stepId}/ipc-checks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkName: values.checkName,
          checkType: values.checkType,
          unit: values.unit || undefined,
          specification: values.specification || undefined,
          targetValue: values.targetValue !== "" ? Number(values.targetValue) : undefined,
          minValue: values.minValue !== "" ? Number(values.minValue) : undefined,
          maxValue: values.maxValue !== "" ? Number(values.maxValue) : undefined,
          frequency: values.frequency || undefined,
          sampleSize: values.sampleSize || undefined,
          isCritical: values.isCritical,
          sequenceOrder: Number(values.sequenceOrder),
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message ?? "Failed to add IPC check"); return }
      onAdded(json.data)
      toast.success("IPC check added")
      reset()
    } catch { toast.error("Unexpected error") }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-lg border border-green-100 bg-green-50/40 p-3">
      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Add IPC Check</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Check Name *</Label>
          <Input className="h-8 text-xs" placeholder="e.g. Blend Uniformity" {...register("checkName", { required: true })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Check Type</Label>
          <Select defaultValue="numeric" onValueChange={(v) => setValue("checkType", v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="numeric" className="text-xs">Numeric</SelectItem>
              <SelectItem value="text" className="text-xs">Text</SelectItem>
              <SelectItem value="pass_fail" className="text-xs">Pass/Fail</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit</Label>
          <Input className="h-8 text-xs" placeholder="NMT, %, mg..." {...register("unit")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Specification</Label>
          <Input className="h-8 text-xs" placeholder="e.g. NMT 2% RSD" {...register("specification")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Min Value</Label>
          <Input type="number" step="any" className="h-8 text-xs" {...register("minValue")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Max Value</Label>
          <Input type="number" step="any" className="h-8 text-xs" {...register("maxValue")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Frequency</Label>
          <Input className="h-8 text-xs" placeholder="e.g. Every 30 min" {...register("frequency")} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sample Size</Label>
          <Input className="h-8 text-xs" placeholder="e.g. 10 tablets" {...register("sampleSize")} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id={`ic-${stepId}`} checked={isCritical} onCheckedChange={(c) => setValue("isCritical", Boolean(c))} />
        <Label htmlFor={`ic-${stepId}`} className="text-xs cursor-pointer">Critical IPC check</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" className="h-7 text-xs gap-1" disabled={saving}>
          {saving && <Loader2 className="h-3 w-3 animate-spin" />} Add
        </Button>
      </div>
    </form>
  )
}

// ---------- Main Step Component ----------

interface ProcessTemplate {
  id: string
  name: string
  code: string
  category: string
  steps: {
    stepNumber: number
    stepName: string
    stage?: string | null
    instructions: string
    equipmentType?: string | null
    estimatedDurationMinutes?: number | null
    requiresLineClearance: boolean
    requiresEnvironmentalCheck: boolean
    envTempMin?: number | null
    envTempMax?: number | null
    envHumidityMin?: number | null
    envHumidityMax?: number | null
    parameters: {
      parameterName: string
      parameterType: string
      unit?: string | null
      targetValue?: string | null
      minValue?: number | null
      maxValue?: number | null
      isCritical: boolean
      sequenceOrder: number
    }[]
    ipcChecks: {
      checkName: string
      checkType: string
      unit?: string | null
      specification?: string | null
      targetValue?: number | null
      minValue?: number | null
      maxValue?: number | null
      frequency?: string | null
      sampleSize?: string | null
      isCritical: boolean
      sequenceOrder: number
    }[]
  }[]
}

export function MBRStepsStep({ mbrId, onComplete, onBack }: Props) {
  const [steps, setSteps] = useState<MBRStep[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddStep, setShowAddStep] = useState(false)
  const [addingStep, setAddingStep] = useState(false)
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [showParamFormForStep, setShowParamFormForStep] = useState<string | null>(null)
  const [showIPCFormForStep, setShowIPCFormForStep] = useState<string | null>(null)
  const [deletingParamId, setDeletingParamId] = useState<string | null>(null)
  const [deletingIPCId, setDeletingIPCId] = useState<string | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [importingTemplateId, setImportingTemplateId] = useState<string | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiDescription, setAIDescription] = useState("")
  const [aiGenerating, setAIGenerating] = useState(false)
  const [aiGeneratedStep, setAIGeneratedStep] = useState<null | {
    stepName: string; stage?: string; instructions: string; equipmentType?: string
    estimatedDurationMinutes?: number; requiresLineClearance: boolean
    requiresEnvironmentalCheck: boolean; envTempMin?: number; envTempMax?: number
    envHumidityMin?: number; envHumidityMax?: number
    parameters: Array<{ parameterName: string; parameterType: string; unit?: string; targetValue?: string; minValue?: number; maxValue?: number; isCritical: boolean; sequenceOrder: number }>
    ipcChecks: Array<{ checkName: string; checkType: string; unit?: string; specification?: string; targetValue?: number; minValue?: number; maxValue?: number; frequency?: string; sampleSize?: string; isCritical: boolean; sequenceOrder: number }>
    rationale: string
  }>(null)
  const [applyingAIStep, setApplyingAIStep] = useState(false)

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const { register, handleSubmit, setValue, watch, reset } = useForm<StepFormValues>({
    defaultValues: {
      requiresLineClearance: false,
      requiresEnvironmentalCheck: false,
    },
  })

  const requiresEnvCheck = watch("requiresEnvironmentalCheck")
  const requiresLineClearance = watch("requiresLineClearance")

  useEffect(() => {
    async function fetchSteps() {
      try {
        const res = await fetch(`/api/mbr/${mbrId}/steps`)
        const json = await res.json()
        setSteps(json.data ?? [])
      } catch {
        toast.error("Failed to load steps")
      } finally {
        setLoading(false)
      }
    }
    fetchSteps()
  }, [mbrId])

  async function loadTemplates() {
    try {
      const res = await fetch("/api/process-templates")
      const json = await res.json()
      setTemplates(json.data ?? [])
    } catch {
      // ignore — templates are optional
    }
  }

  async function handleImportTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    setImportingTemplateId(templateId)
    try {
      const startStepNumber = steps.length + 1
      for (let i = 0; i < template.steps.length; i++) {
        const s = template.steps[i]
        const res = await fetch(`/api/mbr/${mbrId}/steps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stepNumber: startStepNumber + i,
            stepName: s.stepName,
            stage: s.stage,
            instructions: s.instructions,
            equipmentType: s.equipmentType,
            estimatedDurationMinutes: s.estimatedDurationMinutes,
            requiresLineClearance: s.requiresLineClearance,
            requiresEnvironmentalCheck: s.requiresEnvironmentalCheck,
            envTempMin: s.envTempMin,
            envTempMax: s.envTempMax,
            envHumidityMin: s.envHumidityMin,
            envHumidityMax: s.envHumidityMax,
            parameters: s.parameters.map((p) => ({
              parameterName: p.parameterName,
              parameterType: p.parameterType,
              unit: p.unit,
              targetValue: p.targetValue,
              minValue: p.minValue,
              maxValue: p.maxValue,
              isCritical: p.isCritical,
              sequenceOrder: p.sequenceOrder,
            })),
            ipcChecks: s.ipcChecks.map((c) => ({
              checkName: c.checkName,
              checkType: c.checkType,
              unit: c.unit,
              specification: c.specification,
              targetValue: c.targetValue,
              minValue: c.minValue,
              maxValue: c.maxValue,
              frequency: c.frequency,
              sampleSize: c.sampleSize,
              isCritical: c.isCritical,
              sequenceOrder: c.sequenceOrder,
            })),
          }),
        })
        if (res.ok) {
          const json = await res.json()
          setSteps((prev) => [...prev, json.data])
        }
      }
      toast.success(`Imported ${template.steps.length} steps from "${template.name}"`)
      setShowImportModal(false)
    } catch {
      toast.error("Failed to import template")
    } finally {
      setImportingTemplateId(null)
    }
  }

  async function handleAIGenerate() {
    if (!aiDescription.trim()) { toast.error("Please describe the step first"); return }
    setAIGenerating(true)
    setAIGeneratedStep(null)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiDescription, existingStepCount: steps.length }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message ?? "AI generation failed"); return }
      setAIGeneratedStep(json.data.step)
    } catch { toast.error("Failed to generate step") }
    finally { setAIGenerating(false) }
  }

  async function handleApplyAIStep() {
    if (!aiGeneratedStep) return
    setApplyingAIStep(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber: steps.length + 1,
          stepName: aiGeneratedStep.stepName,
          stage: aiGeneratedStep.stage,
          instructions: aiGeneratedStep.instructions,
          equipmentType: aiGeneratedStep.equipmentType,
          estimatedDurationMinutes: aiGeneratedStep.estimatedDurationMinutes,
          requiresLineClearance: aiGeneratedStep.requiresLineClearance,
          requiresEnvironmentalCheck: aiGeneratedStep.requiresEnvironmentalCheck,
          envTempMin: aiGeneratedStep.envTempMin,
          envTempMax: aiGeneratedStep.envTempMax,
          envHumidityMin: aiGeneratedStep.envHumidityMin,
          envHumidityMax: aiGeneratedStep.envHumidityMax,
          parameters: aiGeneratedStep.parameters,
          ipcChecks: aiGeneratedStep.ipcChecks,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message ?? "Failed to add step"); return }
      setSteps((prev) => [...prev, json.data])
      toast.success(`Step "${aiGeneratedStep.stepName}" added from AI suggestion`)
      setShowAIGenerator(false)
      setAIDescription("")
      setAIGeneratedStep(null)
    } catch { toast.error("Unexpected error") }
    finally { setApplyingAIStep(false) }
  }

  async function onAddStep(values: StepFormValues) {
    setAddingStep(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber: steps.length + 1,
          stepName: values.stepName,
          stage: values.stage || undefined,
          instructions: values.instructions,
          equipmentType: values.equipmentType || undefined,
          estimatedDurationMinutes: values.estimatedDurationMinutes ? Number(values.estimatedDurationMinutes) : undefined,
          requiresLineClearance: values.requiresLineClearance,
          requiresEnvironmentalCheck: values.requiresEnvironmentalCheck,
          envTempMin: values.envTempMin !== "" ? Number(values.envTempMin) : undefined,
          envTempMax: values.envTempMax !== "" ? Number(values.envTempMax) : undefined,
          envHumidityMin: values.envHumidityMin !== "" ? Number(values.envHumidityMin) : undefined,
          envHumidityMax: values.envHumidityMax !== "" ? Number(values.envHumidityMax) : undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message ?? "Failed to add step")
        return
      }

      setSteps((prev) => [...prev, json.data])
      toast.success("Step added")
      reset()
      setShowAddStep(false)
    } catch {
      toast.error("Unexpected error")
    } finally {
      setAddingStep(false)
    }
  }

  async function handleDeleteStep(stepId: string) {
    setDeletingStepId(stepId)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/${stepId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to remove step"); return }
      setSteps((prev) => prev.filter((s) => s.id !== stepId))
      toast.success("Step removed")
    } catch { toast.error("Unexpected error") }
    finally { setDeletingStepId(null) }
  }

  async function handleDeleteParameter(stepId: string, parameterId: string) {
    setDeletingParamId(parameterId)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/${stepId}/parameters/${parameterId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete parameter"); return }
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId
            ? { ...s, parameters: s.parameters.filter((p) => p.id !== parameterId) }
            : s
        )
      )
      toast.success("Parameter deleted")
    } catch { toast.error("Unexpected error") }
    finally { setDeletingParamId(null) }
  }

  async function handleDeleteIPC(stepId: string, ipcId: string) {
    setDeletingIPCId(ipcId)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/steps/${stepId}/ipc-checks/${ipcId}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete IPC check"); return }
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId
            ? { ...s, ipcChecks: s.ipcChecks.filter((c) => c.id !== ipcId) }
            : s
        )
      )
      toast.success("IPC check deleted")
    } catch { toast.error("Unexpected error") }
    finally { setDeletingIPCId(null) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Manufacturing Steps
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Define each step of the manufacturing process, with parameters and in-process checks.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  loadTemplates()
                  setShowImportModal(true)
                  setShowAddStep(false)
                  setShowAIGenerator(false)
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Import Template
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 border-gray-300"
                onClick={() => {
                  setShowAIGenerator((v) => !v)
                  setShowAddStep(false)
                  setShowImportModal(false)
                  setAIGeneratedStep(null)
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Generate with AI
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  setShowAddStep((v) => !v)
                  setShowAIGenerator(false)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Step
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* AI Step Generator */}
        {showAIGenerator && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gray-700" />
                    <p className="text-xs font-semibold text-gray-800">Generate Step with AI</p>
                    <span className="text-[10px] font-medium text-gray-500 border border-gray-300 rounded-full px-2 py-0.5">
                      Review before adding
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowAIGenerator(false); setAIGeneratedStep(null) }}
                    className="text-gray-400 hover:text-gray-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-gray-700">Describe this manufacturing step in plain English</Label>
                  <Textarea
                    rows={3}
                    placeholder="e.g. Wet granulation using water as granulation fluid — mix dry blend in RMG for 5 minutes, then add water slowly over 10 minutes while mixing at 500 rpm, granulate until endpoint"
                    className="text-sm resize-none bg-white"
                    value={aiDescription}
                    onChange={(e) => setAIDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-black text-white hover:bg-gray-800"
                    onClick={handleAIGenerate}
                    disabled={aiGenerating || !aiDescription.trim()}
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {aiGenerating ? "Generating…" : "Generate Step"}
                  </Button>
                </div>

                {/* AI Result Preview */}
                {aiGeneratedStep && (
                  <div className="mt-2 space-y-4 rounded-lg border border-gray-200 bg-white p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Step Name</p>
                      <p className="text-sm font-semibold text-gray-900">{aiGeneratedStep.stepName}</p>
                      {aiGeneratedStep.stage && (
                        <p className="text-xs text-gray-500 mt-0.5">Stage: {aiGeneratedStep.stage}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Instructions</p>
                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{aiGeneratedStep.instructions}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {aiGeneratedStep.equipmentType && <span>Equipment: <span className="text-gray-800">{aiGeneratedStep.equipmentType}</span></span>}
                      {aiGeneratedStep.estimatedDurationMinutes && <span>Duration: <span className="text-gray-800">{aiGeneratedStep.estimatedDurationMinutes} min</span></span>}
                      {aiGeneratedStep.requiresLineClearance && <span className="text-gray-700">· Line clearance required</span>}
                      {aiGeneratedStep.requiresEnvironmentalCheck && (
                        <span className="text-gray-700">· Env: {aiGeneratedStep.envTempMin}–{aiGeneratedStep.envTempMax}°C, {aiGeneratedStep.envHumidityMin}–{aiGeneratedStep.envHumidityMax}% RH</span>
                      )}
                    </div>
                    {aiGeneratedStep.parameters.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">Parameters ({aiGeneratedStep.parameters.length})</p>
                        <div className="space-y-1">
                          {aiGeneratedStep.parameters.map((p, i) => (
                            <div key={i} className="flex items-center gap-2 rounded bg-gray-50 px-2.5 py-1.5 text-xs">
                              <span className="font-medium text-gray-800">{p.parameterName}</span>
                              {p.unit && <span className="text-gray-400">{p.unit}</span>}
                              {p.minValue != null && p.maxValue != null && (
                                <span className="text-gray-500">{p.minValue}–{p.maxValue}</span>
                              )}
                              {p.isCritical && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded px-1">Critical</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiGeneratedStep.ipcChecks.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-1">IPC Checks ({aiGeneratedStep.ipcChecks.length})</p>
                        <div className="space-y-1">
                          {aiGeneratedStep.ipcChecks.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 rounded bg-green-50/60 px-2.5 py-1.5 text-xs">
                              <span className="font-medium text-gray-800">{c.checkName}</span>
                              {c.specification && <span className="text-gray-500">{c.specification}</span>}
                              {c.frequency && <span className="text-gray-400">{c.frequency}</span>}
                              {c.isCritical && <span className="text-[10px] font-bold bg-orange-100 text-orange-600 rounded px-1">Critical</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiGeneratedStep.rationale && (
                      <p className="text-xs text-gray-500 italic border-t border-gray-100 pt-2">{aiGeneratedStep.rationale}</p>
                    )}
                    <div className="flex gap-2 justify-end border-t border-gray-100 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => { setAIGeneratedStep(null); setAIDescription("") }}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs gap-1 bg-black text-white hover:bg-gray-800"
                        onClick={handleApplyAIStep}
                        disabled={applyingAIStep}
                      >
                        {applyingAIStep && <Loader2 className="h-3 w-3 animate-spin" />}
                        Add This Step
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {/* Import from Template modal */}
        {showImportModal && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <div className="rounded-lg border border-green-100 bg-green-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Import Process Template</p>
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="text-gray-400 hover:text-gray-700 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                {templates.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No process templates found. Create templates in{" "}
                    <a href="/admin/config/processes" className="underline" target="_blank">
                      Admin → Config → Process Templates
                    </a>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-3 py-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">
                            {t.steps.length} step{t.steps.length !== 1 ? "s" : ""} · {t.category}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={importingTemplateId === t.id}
                          onClick={() => handleImportTemplate(t.id)}
                        >
                          {importingTemplateId === t.id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : null}
                          Import
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </>
        )}

        {showAddStep && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onAddStep)} className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    New Step — #{steps.length + 1}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Step Name *</Label>
                      <Input
                        placeholder="e.g. Granulation"
                        {...register("stepName", { required: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Stage</Label>
                      <Select onValueChange={(v) => setValue("stage", v)}>
                        <SelectTrigger><SelectValue placeholder="Select stage..." /></SelectTrigger>
                        <SelectContent>
                          {MANUFACTURING_STAGES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Instructions *</Label>
                    <Textarea
                      placeholder="Describe the step in detail..."
                      rows={3}
                      {...register("instructions", { required: true })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Equipment Type</Label>
                      <Input placeholder="e.g. Rapid Mixer Granulator" {...register("equipmentType")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Estimated Duration (minutes)</Label>
                      <Input type="number" placeholder="e.g. 30" {...register("estimatedDurationMinutes")} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="requiresLineClearance"
                        checked={requiresLineClearance}
                        onCheckedChange={(c) => setValue("requiresLineClearance", Boolean(c))}
                      />
                      <Label htmlFor="requiresLineClearance" className="text-xs cursor-pointer">
                        Requires Line Clearance
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="requiresEnvironmentalCheck"
                        checked={requiresEnvCheck}
                        onCheckedChange={(c) => setValue("requiresEnvironmentalCheck", Boolean(c))}
                      />
                      <Label htmlFor="requiresEnvironmentalCheck" className="text-xs cursor-pointer">
                        Requires Environmental Check
                      </Label>
                    </div>
                  </div>

                  {requiresEnvCheck && (
                    <div className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-white p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Temp Min (°C)</Label>
                        <Input type="number" step="0.1" {...register("envTempMin")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Temp Max (°C)</Label>
                        <Input type="number" step="0.1" {...register("envTempMax")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Humidity Min (%)</Label>
                        <Input type="number" step="0.1" {...register("envHumidityMin")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Humidity Max (%)</Label>
                        <Input type="number" step="0.1" {...register("envHumidityMax")} />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddStep(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={addingStep} className="gap-1.5">
                      {addingStep && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Add Step
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </>
        )}

        <CardContent className="pt-0 pb-0">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <ListOrdered className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No steps added yet.</p>
              <p className="text-xs text-gray-400">Click &quot;Add Step&quot; above to define the manufacturing process.</p>
            </div>
          ) : (
            <div className="w-full divide-y divide-gray-100">
              {steps.map((step) => {
                const isExpanded = expandedSteps.has(step.id)
                return (
                  <div key={step.id}>
                    {/* Step header row */}
                    <div
                      className="flex items-center gap-3 py-3 cursor-pointer hover:bg-gray-50/50 px-1 rounded"
                      onClick={() => toggleStep(step.id)}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                        {step.stepNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{step.stepName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {step.stage && (
                            <span className="text-xs text-gray-400">{step.stage}</span>
                          )}
                          {step.parameters.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {step.parameters.length} param{step.parameters.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                          {step.ipcChecks.length > 0 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-green-50 text-green-700">
                              {step.ipcChecks.length} IPC
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400 hover:text-red-500 shrink-0"
                        disabled={deletingStepId === step.id}
                        onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id) }}
                      >
                        {deletingStepId === step.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {/* Step expanded content */}
                    {isExpanded && (
                      <div className="pb-4 space-y-4 pl-10 pr-1">
                        {/* Step details */}
                        <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap border-l-2 border-gray-200 pl-3">
                          {step.instructions}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          {step.equipmentType && <span>Equipment: {step.equipmentType}</span>}
                          {step.estimatedDurationMinutes && <span>Duration: {step.estimatedDurationMinutes} min</span>}
                          {step.requiresLineClearance && <Badge variant="outline" className="text-xs">Line Clearance Required</Badge>}
                          {step.requiresEnvironmentalCheck && (
                            <Badge variant="outline" className="text-xs">
                              Env. Check: {step.envTempMin}–{step.envTempMax}°C, {step.envHumidityMin}–{step.envHumidityMax}% RH
                            </Badge>
                          )}
                        </div>

                        <Separator />

                        {/* Process Parameters */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-700">Process Parameters</p>
                            {showParamFormForStep !== step.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => setShowParamFormForStep(step.id)}
                              >
                                <Plus className="h-3 w-3" /> Add Parameter
                              </Button>
                            )}
                          </div>

                          {showParamFormForStep === step.id && (
                            <AddParameterForm
                              stepId={step.id}
                              mbrId={mbrId}
                              existingCount={step.parameters.length}
                              onAdded={(param) => {
                                setSteps((prev) =>
                                  prev.map((s) =>
                                    s.id === step.id
                                      ? { ...s, parameters: [...s.parameters, param] }
                                      : s
                                  )
                                )
                                setShowParamFormForStep(null)
                              }}
                              onCancel={() => setShowParamFormForStep(null)}
                            />
                          )}

                          {step.parameters.length === 0 && showParamFormForStep !== step.id && (
                            <p className="text-xs text-gray-400 italic">No parameters defined.</p>
                          )}

                          {step.parameters.map((param) => (
                            <div key={param.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-2">
                              <div>
                                <span className="text-xs font-medium text-gray-800">{param.parameterName}</span>
                                <span className="ml-2 text-xs text-gray-400">
                                  {param.parameterType}
                                  {param.unit && ` · ${param.unit}`}
                                  {param.minValue !== undefined && param.maxValue !== undefined && ` · ${param.minValue}–${param.maxValue}`}
                                </span>
                                {param.isCritical && (
                                  <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600 bg-orange-50 py-0">Critical</Badge>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                disabled={deletingParamId === param.id}
                                onClick={() => handleDeleteParameter(step.id, param.id)}
                              >
                                {deletingParamId === param.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </Button>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {/* IPC Checks */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-gray-700">In-Process Checks (IPC)</p>
                            {showIPCFormForStep !== step.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => setShowIPCFormForStep(step.id)}
                              >
                                <Plus className="h-3 w-3" /> Add IPC Check
                              </Button>
                            )}
                          </div>

                          {showIPCFormForStep === step.id && (
                            <AddIPCForm
                              stepId={step.id}
                              mbrId={mbrId}
                              existingCount={step.ipcChecks.length}
                              onAdded={(check) => {
                                setSteps((prev) =>
                                  prev.map((s) =>
                                    s.id === step.id
                                      ? { ...s, ipcChecks: [...s.ipcChecks, check] }
                                      : s
                                  )
                                )
                                setShowIPCFormForStep(null)
                              }}
                              onCancel={() => setShowIPCFormForStep(null)}
                            />
                          )}

                          {step.ipcChecks.length === 0 && showIPCFormForStep !== step.id && (
                            <p className="text-xs text-gray-400 italic">No IPC checks defined.</p>
                          )}

                          {step.ipcChecks.map((check) => (
                            <div key={check.id} className="flex items-center justify-between rounded bg-green-50/60 px-3 py-2">
                              <div>
                                <span className="text-xs font-medium text-gray-800">{check.checkName}</span>
                                <span className="ml-2 text-xs text-gray-400">
                                  {check.checkType}
                                  {check.specification && ` · ${check.specification}`}
                                  {check.frequency && ` · ${check.frequency}`}
                                </span>
                                {check.isCritical && (
                                  <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600 bg-orange-50 py-0">Critical</Badge>
                                )}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-gray-400 hover:text-red-500"
                                disabled={deletingIPCId === check.id}
                                onClick={() => handleDeleteIPC(step.id, check.id)}
                              >
                                {deletingIPCId === check.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => onComplete(steps.length)}>
          Continue to Review
        </Button>
      </div>
    </div>
  )
}
