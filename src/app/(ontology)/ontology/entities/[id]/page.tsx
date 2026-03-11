"use client"

import { useEffect, useState, useCallback } from "react"
import { use } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Shield, Trash2, Zap, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type OntologyAttribute = {
  id: string
  name: string
  displayName: string
  dataType: string
  description: string | null
  isRequired: boolean
  isSystem: boolean
  enumOptions: string[] | null
  section: string | null
  unit: string | null
  isCritical: boolean
  formula: string | null
  referenceEntityId: string | null
  sortOrder: number
}

type OntologyEntity = {
  id: string
  name: string
  displayName: string
  pluralLabel: string
  description: string | null
  icon: string | null
  isSystem: boolean
  group: string
  color: string | null
  prismaModel: string | null
  appRoute: string | null
  hasLifecycle: boolean
  isVersioned: boolean
  attributes?: OntologyAttribute[]
}

type LifecycleState = {
  id: string
  code: string
  label: string
  color: string
  isInitial: boolean
  isTerminal: boolean
  sortOrder: number
}

type LifecycleTransition = {
  id: string
  fromStateId: string
  toStateId: string
  action: string
  label: string
  requiredRoles: string[]
  requiresSignature: boolean
}

type Lifecycle = {
  id: string
  name: string
  isSystem: boolean
  states: LifecycleState[]
  transitions: LifecycleTransition[]
}

type OntologyConstraint = {
  id: string
  code: string
  name: string
  constraintType: string
  severity: string
  errorMessage: string
  isSystem: boolean
  isActive: boolean
  rule: unknown
}

const ALL_DATA_TYPES = [
  "text", "number", "boolean", "date", "datetime",
  "select", "multiselect", "reference", "textarea",
  "computed", "email", "url", "file",
]

const CONSTRAINT_TYPES = [
  "required_field", "range_check", "cross_field", "cross_entity",
  "temporal", "conditional", "unique_field",
]

const SEVERITY_OPTIONS = ["error", "warning", "info"]

function autoSlug(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
}

function dataTypeBadge(dt: string) {
  return (
    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-mono">
      {dt}
    </span>
  )
}

type Params = { id: string }

export default function EntityDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params)
  const [entity, setEntity] = useState<OntologyEntity | null>(null)
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null)
  const [constraints, setConstraints] = useState<OntologyConstraint[]>([])
  const [allEntities, setAllEntities] = useState<OntologyEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"attributes" | "lifecycle" | "constraints">("attributes")

  // Add attribute form state
  const [showAddAttr, setShowAddAttr] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAttr, setNewAttr] = useState({
    name: "", displayName: "", dataType: "text", section: "", unit: "",
    isRequired: false, helpText: "", defaultValue: "", formula: "",
    enumOptions: "", referenceEntityId: "",
  })

  // Add constraint form state
  const [showAddConstraint, setShowAddConstraint] = useState(false)
  const [newConstraint, setNewConstraint] = useState({
    name: "", code: "", constraintType: "required_field", severity: "error",
    errorMessage: "", rule: "{}",
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [entRes, lcRes, conRes, allEntRes] = await Promise.all([
        fetch(`/api/ontology/entities/${id}`),
        fetch(`/api/ontology/lifecycles?entityId=${id}`),
        fetch(`/api/ontology/constraints?entityId=${id}`),
        fetch("/api/ontology/entities"),
      ])
      const [entData, lcData, conData, allEntData] = await Promise.all([
        entRes.json(), lcRes.json(), conRes.json(), allEntRes.json(),
      ])
      if (entData.success) setEntity(entData.data)
      if (lcData.success) setLifecycle(lcData.data[0] ?? null)
      if (conData.success) setConstraints(conData.data)
      if (allEntData.success) setAllEntities(allEntData.data)
    } catch (e) {
      console.error(e)
      toast.error("Failed to load entity")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreateAttribute() {
    if (!newAttr.name || !newAttr.displayName) {
      toast.error("Name and Display Name are required")
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        entityId: id,
        name: newAttr.name,
        displayName: newAttr.displayName,
        dataType: newAttr.dataType,
        isRequired: newAttr.isRequired,
        section: newAttr.section || undefined,
        unit: newAttr.unit || undefined,
        helpText: newAttr.helpText || undefined,
        defaultValue: newAttr.defaultValue || undefined,
      }
      if (newAttr.dataType === "computed") {
        payload.formula = newAttr.formula || undefined
      }
      if (newAttr.dataType === "reference") {
        payload.referenceEntityId = newAttr.referenceEntityId || undefined
      }
      if (newAttr.dataType === "select" || newAttr.dataType === "multiselect") {
        payload.enumOptions = newAttr.enumOptions
          ? newAttr.enumOptions.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined
      }
      const res = await fetch("/api/ontology/attributes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Attribute added")
      setNewAttr({ name: "", displayName: "", dataType: "text", section: "", unit: "", isRequired: false, helpText: "", defaultValue: "", formula: "", enumOptions: "", referenceEntityId: "" })
      setShowAddAttr(false)
      await loadData()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleDeleteAttribute(attrId: string) {
    if (!confirm("Delete this attribute?")) return
    const res = await fetch(`/api/ontology/attributes/${attrId}`, { method: "DELETE" })
    const data = await res.json()
    if (data.success) {
      toast.success("Attribute deleted")
      await loadData()
    } else {
      toast.error(data.message ?? "Failed to delete")
    }
  }

  async function handleToggleConstraint(constraintId: string, current: boolean) {
    const res = await fetch(`/api/ontology/constraints/${constraintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    const data = await res.json()
    if (data.success) {
      setConstraints((prev) => prev.map((c) => c.id === constraintId ? { ...c, isActive: !current } : c))
    } else {
      toast.error(data.message ?? "Failed to toggle")
    }
  }

  async function handleDeleteConstraint(constraintId: string) {
    if (!confirm("Delete this constraint?")) return
    const res = await fetch(`/api/ontology/constraints/${constraintId}`, { method: "DELETE" })
    const data = await res.json()
    if (data.success) {
      toast.success("Constraint deleted")
      setConstraints((prev) => prev.filter((c) => c.id !== constraintId))
    } else {
      toast.error(data.message ?? "Failed to delete")
    }
  }

  async function handleCreateConstraint() {
    if (!newConstraint.name || !newConstraint.code || !newConstraint.errorMessage) {
      toast.error("Name, Code, and Error Message are required")
      return
    }
    let rule: Record<string, unknown> = {}
    try {
      rule = JSON.parse(newConstraint.rule)
    } catch {
      toast.error("Rule must be valid JSON")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ontology/constraints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: id,
          code: newConstraint.code,
          name: newConstraint.name,
          constraintType: newConstraint.constraintType,
          severity: newConstraint.severity,
          errorMessage: newConstraint.errorMessage,
          rule,
        }),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Constraint added")
      setNewConstraint({ name: "", code: "", constraintType: "required_field", severity: "error", errorMessage: "", rule: "{}" })
      setShowAddConstraint(false)
      await loadData()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!entity) {
    return (
      <div className="text-center py-16 text-gray-400">
        Entity not found.{" "}
        <Link href="/ontology/entities" className="underline">Back to Entities</Link>
      </div>
    )
  }

  const stateById = (stateId: string) =>
    lifecycle?.states.find((s) => s.id === stateId)

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/ontology/entities"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Entities
      </Link>

      {/* Entity Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <div
            className="w-3 h-3 rounded-full mt-1.5 shrink-0"
            style={{ backgroundColor: entity.color ?? "#6b7280" }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {entity.icon && <span className="text-2xl">{entity.icon}</span>}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{entity.displayName}</h1>
                <p className="text-sm text-gray-400">{entity.pluralLabel}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                {entity.group.replace(/_/g, " ")}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                {entity.isSystem ? <><Shield className="h-2.5 w-2.5" /> System</> : "Custom"}
              </span>
              {entity.isVersioned && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">Versioned</span>
              )}
              {entity.hasLifecycle && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Has lifecycle
                </span>
              )}
            </div>

            {(entity.prismaModel || entity.appRoute) && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {entity.prismaModel && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    ↔ {entity.prismaModel}
                  </span>
                )}
                {entity.appRoute && (
                  <span className="text-xs text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    → {entity.appRoute}
                  </span>
                )}
              </div>
            )}

            {entity.description && (
              <p className="text-sm text-gray-500 mt-2">{entity.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {(["attributes", "lifecycle", "constraints"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize",
                tab === t
                  ? "border-black text-black"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Attributes Tab */}
      {tab === "attributes" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">Attributes</p>
            <Button size="sm" variant="outline" onClick={() => setShowAddAttr(!showAddAttr)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Attribute
            </Button>
          </div>

          {showAddAttr && (
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 space-y-4">
              <p className="text-xs font-semibold text-gray-700">New Attribute</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Display Name *</Label>
                  <Input
                    placeholder="e.g. Batch Number"
                    value={newAttr.displayName}
                    onChange={(e) => {
                      const v = e.target.value
                      setNewAttr((p) => ({ ...p, displayName: v, name: autoSlug(v) }))
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Name (slug) *</Label>
                  <Input
                    placeholder="e.g. batch_number"
                    value={newAttr.name}
                    onChange={(e) => setNewAttr((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Data Type</Label>
                  <select
                    value={newAttr.dataType}
                    onChange={(e) => setNewAttr((p) => ({ ...p, dataType: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {ALL_DATA_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Section</Label>
                  <Input
                    placeholder="e.g. General"
                    value={newAttr.section}
                    onChange={(e) => setNewAttr((p) => ({ ...p, section: e.target.value }))}
                  />
                </div>
                {newAttr.dataType !== "computed" && newAttr.dataType !== "reference" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      placeholder="e.g. kg, %, months"
                      value={newAttr.unit}
                      onChange={(e) => setNewAttr((p) => ({ ...p, unit: e.target.value }))}
                    />
                  </div>
                )}
                {newAttr.dataType !== "computed" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Value</Label>
                    <Input
                      placeholder="Optional"
                      value={newAttr.defaultValue}
                      onChange={(e) => setNewAttr((p) => ({ ...p, defaultValue: e.target.value }))}
                    />
                  </div>
                )}
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Help Text</Label>
                  <Input
                    placeholder="Optional description shown to users"
                    value={newAttr.helpText}
                    onChange={(e) => setNewAttr((p) => ({ ...p, helpText: e.target.value }))}
                  />
                </div>
                {newAttr.dataType === "computed" && (
                  <div className="space-y-1.5 col-span-3">
                    <Label className="text-xs">Formula</Label>
                    <Input
                      placeholder="e.g. (actual_yield / theoretical_yield) * 100"
                      value={newAttr.formula}
                      onChange={(e) => setNewAttr((p) => ({ ...p, formula: e.target.value }))}
                    />
                  </div>
                )}
                {newAttr.dataType === "reference" && (
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Reference Entity</Label>
                    <select
                      value={newAttr.referenceEntityId}
                      onChange={(e) => setNewAttr((p) => ({ ...p, referenceEntityId: e.target.value }))}
                      className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="">Select entity...</option>
                      {allEntities.map((e) => (
                        <option key={e.id} value={e.id}>{e.displayName}</option>
                      ))}
                    </select>
                  </div>
                )}
                {(newAttr.dataType === "select" || newAttr.dataType === "multiselect") && (
                  <div className="space-y-1.5 col-span-3">
                    <Label className="text-xs">Options (comma-separated)</Label>
                    <Input
                      placeholder="e.g. Option A, Option B, Option C"
                      value={newAttr.enumOptions}
                      onChange={(e) => setNewAttr((p) => ({ ...p, enumOptions: e.target.value }))}
                    />
                  </div>
                )}
                {newAttr.dataType !== "computed" && (
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newAttr.isRequired}
                        onChange={(e) => setNewAttr((p) => ({ ...p, isRequired: e.target.checked }))}
                        className="rounded"
                      />
                      Required
                    </label>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateAttribute} disabled={saving} className="bg-black text-white hover:bg-gray-800">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  Add Attribute
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddAttr(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {(entity.attributes ?? []).length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">No attributes yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Display Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Required</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(entity.attributes ?? []).map((attr) => (
                  <tr key={attr.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{attr.displayName}</span>
                        {attr.isSystem && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> sys
                          </span>
                        )}
                        {attr.isCritical && (
                          <span title="Critical"><Zap className="h-3 w-3 text-amber-500" /></span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{attr.name}</td>
                    <td className="px-4 py-3">{dataTypeBadge(attr.dataType)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{attr.section ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{attr.unit ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-center">
                      {attr.isRequired ? "✓" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!attr.isSystem && (
                        <button
                          onClick={() => handleDeleteAttribute(attr.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Lifecycle Tab */}
      {tab === "lifecycle" && (
        <div className="space-y-4">
          {!entity.hasLifecycle || !lifecycle ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No lifecycle configured for this entity.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-sm font-semibold text-gray-900">{lifecycle.name}</p>
                  {lifecycle.isSystem && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                      <Shield className="h-2.5 w-2.5" /> System
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">States</p>
                <div className="flex flex-wrap gap-2">
                  {lifecycle.states.map((s) => (
                    <div
                      key={s.id}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      <span>{s.label}</span>
                      {s.isInitial && <span className="ml-1 opacity-75">(Initial)</span>}
                      {s.isTerminal && <span className="ml-1 opacity-75">(Terminal)</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">Transitions</p>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">To</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Required Roles</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sig Required</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {lifecycle.transitions.map((t) => {
                      const fromState = stateById(t.fromStateId)
                      const toState = stateById(t.toStateId)
                      return (
                        <tr key={t.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3">
                            {fromState ? (
                              <span
                                className="text-xs font-medium px-2 py-1 rounded text-white"
                                style={{ backgroundColor: fromState.color }}
                              >
                                {fromState.label}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.action}</td>
                          <td className="px-4 py-3">
                            {toState ? (
                              <span
                                className="text-xs font-medium px-2 py-1 rounded text-white"
                                style={{ backgroundColor: toState.color }}
                              >
                                {toState.label}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {t.requiredRoles.join(", ")}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500">
                            {t.requiresSignature ? "✓" : "—"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Constraints Tab */}
      {tab === "constraints" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowAddConstraint(!showAddConstraint)}
              className="bg-black text-white hover:bg-gray-800"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Constraint
            </Button>
          </div>

          {showAddConstraint && (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-700">New Constraint</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name *</Label>
                  <Input
                    placeholder="e.g. Expiry After Manufacturing"
                    value={newConstraint.name}
                    onChange={(e) => {
                      const v = e.target.value
                      setNewConstraint((p) => ({ ...p, name: v, code: autoSlug(v) }))
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Code *</Label>
                  <Input
                    placeholder="e.g. expiry_after_mfg"
                    value={newConstraint.code}
                    onChange={(e) => setNewConstraint((p) => ({ ...p, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <select
                    value={newConstraint.constraintType}
                    onChange={(e) => setNewConstraint((p) => ({ ...p, constraintType: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {CONSTRAINT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severity</Label>
                  <select
                    value={newConstraint.severity}
                    onChange={(e) => setNewConstraint((p) => ({ ...p, severity: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Error Message *</Label>
                  <Input
                    placeholder="e.g. Expiry date must be after manufacturing date"
                    value={newConstraint.errorMessage}
                    onChange={(e) => setNewConstraint((p) => ({ ...p, errorMessage: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs">Rule (JSON)</Label>
                  <textarea
                    rows={3}
                    value={newConstraint.rule}
                    onChange={(e) => setNewConstraint((p) => ({ ...p, rule: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm font-mono focus:outline-none focus:ring-1 focus:ring-black"
                    placeholder='{"field": "value"}'
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleCreateConstraint} disabled={saving} className="bg-black text-white hover:bg-gray-800">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
                  Add Constraint
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddConstraint(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {constraints.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">No constraints configured</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Error Message</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {constraints.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{c.name}</span>
                          {c.isSystem && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                              <Shield className="h-2.5 w-2.5" /> sys
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        <ConstraintTypeBadge type={c.constraintType} />
                      </td>
                      <td className="px-4 py-3">
                        <SeverityBadge severity={c.severity} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{c.errorMessage}</td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={c.isActive}
                          onChange={() => handleToggleConstraint(c.id, c.isActive)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!c.isSystem && (
                          <button
                            onClick={() => handleDeleteConstraint(c.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ConstraintTypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    required_field: "bg-gray-100 text-gray-700 border-gray-200",
    range_check: "bg-blue-50 text-blue-700 border-blue-200",
    cross_field: "bg-purple-50 text-purple-700 border-purple-200",
    cross_entity: "bg-orange-50 text-orange-700 border-orange-200",
    temporal: "bg-yellow-50 text-yellow-800 border-yellow-200",
    conditional: "bg-red-50 text-red-700 border-red-200",
    unique_field: "bg-teal-50 text-teal-700 border-teal-200",
  }
  const cls = colorMap[type] ?? "bg-gray-100 text-gray-700 border-gray-200"
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {type.replace(/_/g, " ")}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    error: "bg-red-50 text-red-700 border-red-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    info: "bg-gray-100 text-gray-700 border-gray-200",
  }
  const cls = colorMap[severity] ?? "bg-gray-100 text-gray-700 border-gray-200"
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${cls}`}>
      {severity}
    </span>
  )
}
