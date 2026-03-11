"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Lock,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParameterTemplate {
  id: string
  parameterName: string
  parameterType: string
  unit?: string | null
  targetValue?: string | null
  minValue?: number | null
  maxValue?: number | null
  isCritical: boolean
  sequenceOrder: number
}

interface IPCTemplate {
  id: string
  checkName: string
  checkType: string
  unit?: string | null
  specification?: string | null
  minValue?: number | null
  maxValue?: number | null
  frequency?: string | null
  isCritical: boolean
  sequenceOrder: number
}

interface StepTemplate {
  id: string
  stepNumber: number
  stepName: string
  stage?: string | null
  instructions: string
  equipmentType?: string | null
  estimatedDurationMinutes?: number | null
  requiresLineClearance: boolean
  parameters: ParameterTemplate[]
  ipcChecks: IPCTemplate[]
}

interface ProcessTemplate {
  id: string
  code: string
  name: string
  description?: string | null
  category: string
  isSystem: boolean
  isActive: boolean
  steps: StepTemplate[]
}

// ─── Step form types ───────────────────────────────────────────────────────────

type NewParam = {
  parameterName: string
  parameterType: string
  unit: string
  targetValue: string
  minValue: string
  maxValue: string
  isCritical: boolean
}

type NewIpc = {
  checkName: string
  checkType: string
  unit: string
  specification: string
  minValue: string
  maxValue: string
  frequency: string
  isCritical: boolean
}

const BLANK_PARAM: NewParam = {
  parameterName: "",
  parameterType: "numeric",
  unit: "",
  targetValue: "",
  minValue: "",
  maxValue: "",
  isCritical: false,
}

const BLANK_IPC: NewIpc = {
  checkName: "",
  checkType: "numeric",
  unit: "",
  specification: "",
  minValue: "",
  maxValue: "",
  frequency: "",
  isCritical: false,
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProcessesPage() {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ProcessTemplate | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAddStep, setShowAddStep] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/process-templates")
      const data = await res.json()
      if (res.ok) setTemplates(data.data ?? [])
    } catch {
      toast.error("Failed to load process templates")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function selectTemplate(t: ProcessTemplate) {
    setSelected(t)
    setShowCreate(false)
    setShowAddStep(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this process template? This cannot be undone.")) return
    const res = await fetch(`/api/process-templates/${id}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Template deleted")
      if (selected?.id === id) setSelected(null)
      load()
    } else {
      const data = await res.json()
      toast.error(data.message ?? "Failed to delete")
    }
  }

  async function handleStepDelete(templateId: string, stepId: string) {
    const res = await fetch(`/api/process-templates/${templateId}/steps/${stepId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast.success("Step removed")
      load().then(() => {
        // refresh selected
        setSelected((prev) =>
          prev?.id === templateId
            ? { ...prev, steps: prev.steps.filter((s) => s.id !== stepId) }
            : prev
        )
      })
    } else {
      toast.error("Failed to delete step")
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Left: template list */}
      <div className="w-72 flex-shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-gray-900">Process Templates</h1>
            <p className="text-xs text-gray-500 mt-0.5">Reusable manufacturing step libraries</p>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => { setShowCreate(true); setSelected(null) }}
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center">
            <FlaskConical className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No templates yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowCreate(true)}
            >
              Create first template
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`w-full text-left rounded-lg border px-3.5 py-3 transition-all ${
                  selected?.id === t.id
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${selected?.id === t.id ? "text-white" : "text-gray-900"}`}>
                      {t.name}
                    </p>
                    <p className={`text-xs mt-0.5 ${selected?.id === t.id ? "text-gray-300" : "text-gray-500"}`}>
                      {t.steps.length} step{t.steps.length !== 1 ? "s" : ""} · {t.category}
                    </p>
                  </div>
                  {t.isSystem && (
                    <Lock className={`h-3.5 w-3.5 flex-shrink-0 ${selected?.id === t.id ? "text-gray-300" : "text-gray-400"}`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: detail / create */}
      <div className="flex-1 min-w-0">
        {showCreate && (
          <CreateTemplateForm
            onCreated={(t) => {
              load()
              setShowCreate(false)
              setSelected(t)
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {selected && !showCreate && (
          <TemplateDetail
            template={selected}
            showAddStep={showAddStep}
            onToggleAddStep={() => setShowAddStep((v) => !v)}
            onDelete={() => handleDelete(selected.id)}
            onStepDelete={(stepId) => handleStepDelete(selected.id, stepId)}
            onStepAdded={(step) => {
              setSelected((prev) => prev ? { ...prev, steps: [...prev.steps, step] } : prev)
              setShowAddStep(false)
              load()
            }}
          />
        )}

        {!selected && !showCreate && (
          <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-gray-200">
            <div className="text-center">
              <ChevronRight className="h-8 w-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Select a template to view its steps</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Create template form ─────────────────────────────────────────────────────

function CreateTemplateForm({
  onCreated,
  onCancel,
}: {
  onCreated: (t: ProcessTemplate) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("manufacturing")
  const [saving, setSaving] = useState(false)

  function autoCode(val: string) {
    return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) { toast.error("Name and code are required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/process-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim(), description: description.trim(), category }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message ?? "Failed to create"); return }
      toast.success("Process template created")
      onCreated(data.data)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">New Process Template</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setCode(autoCode(e.target.value)) }}
          placeholder="e.g. Wet Granulation Process"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Code <span className="text-gray-400 font-normal">(auto-generated, editable)</span></Label>
        <Input
          value={code}
          onChange={(e) => setCode(autoCode(e.target.value))}
          placeholder="e.g. wet_granulation"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="packaging">Packaging</SelectItem>
            <SelectItem value="quality">Quality</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Description <span className="text-gray-400 font-normal">(optional)</span></Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Brief description of this process"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
          Create Template
        </Button>
      </div>
    </form>
  )
}

// ─── Template detail ──────────────────────────────────────────────────────────

function TemplateDetail({
  template,
  showAddStep,
  onToggleAddStep,
  onDelete,
  onStepDelete,
  onStepAdded,
}: {
  template: ProcessTemplate
  showAddStep: boolean
  onToggleAddStep: () => void
  onDelete: () => void
  onStepDelete: (stepId: string) => void
  onStepAdded: (step: StepTemplate) => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900">{template.name}</h2>
            {template.isSystem && (
              <Badge variant="secondary" className="text-xs">System</Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">{template.category}</Badge>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{template.code}</p>
          {template.description && (
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
          )}
        </div>
        {!template.isSystem && (
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 h-8"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        )}
      </div>

      {/* Steps list */}
      <div className="space-y-2">
        {template.steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">No steps yet — add the first step below</p>
          </div>
        ) : (
          template.steps.map((step) => (
            <div key={step.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                onClick={() => setExpanded(expanded === step.id ? null : step.id)}
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                  {step.stepNumber}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{step.stepName}</p>
                  <p className="text-xs text-gray-400">
                    {step.parameters.length} param{step.parameters.length !== 1 ? "s" : ""}
                    {step.ipcChecks.length > 0 && ` · ${step.ipcChecks.length} IPC`}
                    {step.equipmentType && ` · ${step.equipmentType}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!template.isSystem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStepDelete(step.id) }}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {expanded === step.id
                    ? <ChevronUp className="h-4 w-4 text-gray-400" />
                    : <ChevronDown className="h-4 w-4 text-gray-400" />
                  }
                </div>
              </button>

              {expanded === step.id && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 space-y-3">
                  <p className="text-xs text-gray-600 leading-relaxed">{step.instructions}</p>

                  {step.parameters.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Parameters</p>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400">
                            <th className="text-left pb-1 font-normal">Name</th>
                            <th className="text-left pb-1 font-normal">Type</th>
                            <th className="text-left pb-1 font-normal">Spec</th>
                            <th className="text-left pb-1 font-normal">Unit</th>
                            <th className="text-left pb-1 font-normal"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {step.parameters.map((p) => (
                            <tr key={p.id}>
                              <td className="py-1 pr-2 font-medium text-gray-700">{p.parameterName}</td>
                              <td className="py-1 pr-2 text-gray-500 capitalize">{p.parameterType}</td>
                              <td className="py-1 pr-2 text-gray-500">
                                {p.minValue != null && p.maxValue != null
                                  ? `${p.minValue}–${p.maxValue}`
                                  : p.targetValue ?? "—"}
                              </td>
                              <td className="py-1 pr-2 text-gray-400">{p.unit ?? "—"}</td>
                              <td className="py-1">
                                {p.isCritical && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="h-2.5 w-2.5" /> CQ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {step.ipcChecks.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">IPC Checks</p>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-gray-100">
                          {step.ipcChecks.map((c) => (
                            <tr key={c.id}>
                              <td className="py-1 pr-2 font-medium text-gray-700">{c.checkName}</td>
                              <td className="py-1 pr-2 text-gray-500">
                                {c.minValue != null && c.maxValue != null
                                  ? `${c.minValue}–${c.maxValue} ${c.unit ?? ""}`.trim()
                                  : c.specification ?? "—"}
                              </td>
                              <td className="py-1 text-gray-400">{c.frequency ?? ""}</td>
                              <td className="py-1">
                                {c.isCritical && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    <AlertTriangle className="h-2.5 w-2.5" /> CQ
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add step */}
      {!template.isSystem && (
        <div>
          {showAddStep ? (
            <AddStepForm
              templateId={template.id}
              nextStepNumber={template.steps.length + 1}
              onAdded={onStepAdded}
              onCancel={onToggleAddStep}
            />
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleAddStep}>
              <Plus className="h-3.5 w-3.5" /> Add Step
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Add step form ────────────────────────────────────────────────────────────

function AddStepForm({
  templateId,
  nextStepNumber,
  onAdded,
  onCancel,
}: {
  templateId: string
  nextStepNumber: number
  onAdded: (step: StepTemplate) => void
  onCancel: () => void
}) {
  const [stepName, setStepName] = useState("")
  const [stage, setStage] = useState("")
  const [instructions, setInstructions] = useState("")
  const [equipmentType, setEquipmentType] = useState("")
  const [duration, setDuration] = useState("")
  const [requiresLC, setRequiresLC] = useState(false)
  const [params, setParams] = useState<NewParam[]>([])
  const [ipcs, setIpcs] = useState<NewIpc[]>([])
  const [saving, setSaving] = useState(false)

  function addParam() { setParams((p) => [...p, { ...BLANK_PARAM }]) }
  function addIpc() { setIpcs((c) => [...c, { ...BLANK_IPC }]) }
  function removeParam(i: number) { setParams((p) => p.filter((_, idx) => idx !== i)) }
  function removeIpc(i: number) { setIpcs((c) => c.filter((_, idx) => idx !== i)) }
  function updateParam(i: number, field: keyof NewParam, value: unknown) {
    setParams((p) => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }
  function updateIpc(i: number, field: keyof NewIpc, value: unknown) {
    setIpcs((c) => c.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stepName.trim() || !instructions.trim()) {
      toast.error("Step name and instructions are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/process-templates/${templateId}/steps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepName: stepName.trim(),
          stage: stage.trim() || undefined,
          instructions: instructions.trim(),
          equipmentType: equipmentType.trim() || undefined,
          estimatedDurationMinutes: duration ? parseInt(duration) : undefined,
          requiresLineClearance: requiresLC,
          parameters: params
            .filter((p) => p.parameterName.trim())
            .map((p, i) => ({
              parameterName: p.parameterName.trim(),
              parameterType: p.parameterType,
              unit: p.unit || undefined,
              targetValue: p.targetValue || undefined,
              minValue: p.minValue !== "" ? parseFloat(p.minValue) : undefined,
              maxValue: p.maxValue !== "" ? parseFloat(p.maxValue) : undefined,
              isCritical: p.isCritical,
              sequenceOrder: i,
            })),
          ipcChecks: ipcs
            .filter((c) => c.checkName.trim())
            .map((c, i) => ({
              checkName: c.checkName.trim(),
              checkType: c.checkType,
              unit: c.unit || undefined,
              specification: c.specification || undefined,
              minValue: c.minValue !== "" ? parseFloat(c.minValue) : undefined,
              maxValue: c.maxValue !== "" ? parseFloat(c.maxValue) : undefined,
              frequency: c.frequency || undefined,
              isCritical: c.isCritical,
              sequenceOrder: i,
            })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.message ?? "Failed to add step"); return }
      toast.success(`Step ${nextStepNumber} added`)
      onAdded(data.data)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Add Step {nextStepNumber}</h3>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Step Name *</Label>
          <Input value={stepName} onChange={(e) => setStepName(e.target.value)} placeholder="e.g. Wet Mixing" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Stage</Label>
          <Input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="e.g. Granulation" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Equipment Type</Label>
          <Input value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} placeholder="e.g. RMG" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs">Instructions *</Label>
          <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={2} placeholder="Step-by-step procedure..." />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Est. Duration (min)</Label>
          <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="15" />
        </div>
        <div className="flex items-center gap-2 pt-5">
          <input
            type="checkbox"
            id="lc"
            checked={requiresLC}
            onChange={(e) => setRequiresLC(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="lc" className="text-xs cursor-pointer">Requires Line Clearance</Label>
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">Parameters</p>
          <button type="button" onClick={addParam} className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {params.map((p, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 grid grid-cols-6 gap-2 items-start">
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-400">Name</Label>
              <Input
                value={p.parameterName}
                onChange={(e) => updateParam(i, "parameterName", e.target.value)}
                className="h-7 text-xs"
                placeholder="Mixing Speed"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400">Type</Label>
              <select
                value={p.parameterType}
                onChange={(e) => updateParam(i, "parameterType", e.target.value)}
                className="h-7 w-full text-xs border border-gray-200 rounded-md px-1.5 bg-white"
              >
                <option value="numeric">Numeric</option>
                <option value="text">Text</option>
                <option value="boolean">Boolean</option>
                <option value="selection">Selection</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400">Min / Max</Label>
              <div className="flex gap-1">
                <Input value={p.minValue} onChange={(e) => updateParam(i, "minValue", e.target.value)} className="h-7 text-xs" placeholder="0" />
                <Input value={p.maxValue} onChange={(e) => updateParam(i, "maxValue", e.target.value)} className="h-7 text-xs" placeholder="100" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400">Unit</Label>
              <Input value={p.unit} onChange={(e) => updateParam(i, "unit", e.target.value)} className="h-7 text-xs" placeholder="RPM" />
            </div>
            <div className="flex items-end gap-1 pb-0.5 justify-end">
              <label className="flex items-center gap-1 text-[10px] text-amber-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={p.isCritical}
                  onChange={(e) => updateParam(i, "isCritical", e.target.checked)}
                  className="rounded"
                />
                CQ
              </label>
              <button type="button" onClick={() => removeParam(i)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* IPC Checks */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-700">IPC Checks</p>
          <button type="button" onClick={addIpc} className="text-xs text-gray-500 hover:text-black flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {ipcs.map((c, i) => (
          <div key={i} className="bg-gray-50 rounded-lg p-3 grid grid-cols-5 gap-2 items-start">
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px] text-gray-400">Check Name</Label>
              <Input
                value={c.checkName}
                onChange={(e) => updateIpc(i, "checkName", e.target.value)}
                className="h-7 text-xs"
                placeholder="LOD Check"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400">Min / Max</Label>
              <div className="flex gap-1">
                <Input value={c.minValue} onChange={(e) => updateIpc(i, "minValue", e.target.value)} className="h-7 text-xs" placeholder="1" />
                <Input value={c.maxValue} onChange={(e) => updateIpc(i, "maxValue", e.target.value)} className="h-7 text-xs" placeholder="3" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-400">Unit / Freq</Label>
              <Input value={c.unit} onChange={(e) => updateIpc(i, "unit", e.target.value)} className="h-7 text-xs" placeholder="%" />
            </div>
            <div className="flex items-end gap-1 pb-0.5 justify-end">
              <label className="flex items-center gap-1 text-[10px] text-amber-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={c.isCritical}
                  onChange={(e) => updateIpc(i, "isCritical", e.target.checked)}
                  className="rounded"
                />
                CQ
              </label>
              <button type="button" onClick={() => removeIpc(i)} className="text-red-400 hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end border-t border-gray-100 pt-3">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
          Add Step
        </Button>
      </div>
    </form>
  )
}
