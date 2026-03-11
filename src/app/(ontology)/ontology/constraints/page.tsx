"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Shield, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  entity: { id: string; name: string; displayName: string }
}

type OntologyEntity = {
  id: string
  name: string
  displayName: string
}

const CONSTRAINT_TYPES = [
  "required_field", "range_check", "cross_field", "cross_entity",
  "temporal", "conditional", "unique_field",
]

const SEVERITY_OPTIONS = ["error", "warning", "info"]

const TYPE_COLORS: Record<string, string> = {
  required_field: "bg-gray-100 text-gray-700 border-gray-200",
  range_check: "bg-blue-50 text-blue-700 border-blue-200",
  cross_field: "bg-purple-50 text-purple-700 border-purple-200",
  cross_entity: "bg-orange-50 text-orange-700 border-orange-200",
  temporal: "bg-yellow-50 text-yellow-800 border-yellow-200",
  conditional: "bg-red-50 text-red-700 border-red-200",
  unique_field: "bg-teal-50 text-teal-700 border-teal-200",
}

const SEVERITY_COLORS: Record<string, string> = {
  error: "bg-red-50 text-red-700 border-red-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-gray-100 text-gray-700 border-gray-200",
}

function autoSlug(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
}

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<OntologyConstraint[]>([])
  const [entities, setEntities] = useState<OntologyEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEntityId, setFilterEntityId] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newConstraint, setNewConstraint] = useState({
    entityId: "",
    name: "",
    code: "",
    constraintType: "required_field",
    severity: "error",
    errorMessage: "",
    rule: "{}",
  })

  const loadConstraints = useCallback(async () => {
    try {
      const url = filterEntityId
        ? `/api/ontology/constraints?entityId=${filterEntityId}`
        : "/api/ontology/constraints"
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) setConstraints(data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filterEntityId])

  useEffect(() => {
    async function loadEntities() {
      const res = await fetch("/api/ontology/entities")
      const data = await res.json()
      if (data.success) setEntities(data.data)
    }
    loadEntities()
  }, [])

  useEffect(() => {
    setLoading(true)
    loadConstraints()
  }, [loadConstraints])

  async function handleToggle(constraintId: string, current: boolean) {
    const res = await fetch(`/api/ontology/constraints/${constraintId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    })
    const data = await res.json()
    if (data.success) {
      setConstraints((prev) =>
        prev.map((c) => c.id === constraintId ? { ...c, isActive: !current } : c)
      )
    } else {
      toast.error(data.message ?? "Failed to toggle")
    }
  }

  async function handleDelete(constraintId: string) {
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

  async function handleCreate() {
    if (!newConstraint.entityId || !newConstraint.name || !newConstraint.code || !newConstraint.errorMessage) {
      toast.error("Entity, Name, Code, and Error Message are required")
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
          entityId: newConstraint.entityId,
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
      toast.success("Constraint created")
      setNewConstraint({ entityId: "", name: "", code: "", constraintType: "required_field", severity: "error", errorMessage: "", rule: "{}" })
      setShowAddForm(false)
      await loadConstraints()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Constraints</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business rules and validation logic</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Constraint
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={filterEntityId}
          onChange={(e) => setFilterEntityId(e.target.value)}
          className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
        >
          <option value="">All Entities</option>
          {entities.map((e) => (
            <option key={e.id} value={e.id}>{e.displayName}</option>
          ))}
        </select>
        {filterEntityId && (
          <button
            onClick={() => setFilterEntityId("")}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">New Constraint</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Entity *</Label>
              <select
                value={newConstraint.entityId}
                onChange={(e) => setNewConstraint((p) => ({ ...p, entityId: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                <option value="">Select entity...</option>
                {entities.map((e) => (
                  <option key={e.id} value={e.id}>{e.displayName}</option>
                ))}
              </select>
            </div>
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
                {CONSTRAINT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Severity</Label>
              <select
                value={newConstraint.severity}
                onChange={(e) => setNewConstraint((p) => ({ ...p, severity: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
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
            <Button size="sm" onClick={handleCreate} disabled={saving} className="bg-black text-white hover:bg-gray-800">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
              Create Constraint
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {constraints.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No constraints found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
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
                    <td className="px-5 py-3 text-xs font-medium text-gray-700">{c.entity.displayName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{c.name}</span>
                        {c.isSystem && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> sys
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{c.code}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[c.constraintType] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {c.constraintType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${SEVERITY_COLORS[c.severity] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {c.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{c.errorMessage}</td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={c.isActive}
                        onChange={() => handleToggle(c.id, c.isActive)}
                        className="rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!c.isSystem && (
                        <button
                          onClick={() => handleDelete(c.id)}
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
    </div>
  )
}
