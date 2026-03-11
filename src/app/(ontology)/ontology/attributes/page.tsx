"use client"

import { useEffect, useState, useCallback, Fragment } from "react"
import { toast } from "sonner"
import { Loader2, Shield, Pencil, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OntologyEntity = {
  id: string
  name: string
  displayName: string
}

type OntologyAttribute = {
  id: string
  name: string
  displayName: string
  dataType: string
  description: string | null
  isRequired: boolean
  isSystem: boolean
  enumOptions: string[] | null
}

function dataTypeBadge(dt: string) {
  return (
    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200 font-mono">
      {dt}
    </span>
  )
}

export default function AttributesPage() {
  const [entities, setEntities] = useState<OntologyEntity[]>([])
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [attributes, setAttributes] = useState<OntologyAttribute[]>([])
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [loadingAttrs, setLoadingAttrs] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ displayName: "", description: "", isRequired: false, enumOptions: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/ontology/entities")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEntities(d.data)
          if (d.data.length > 0) setSelectedEntityId(d.data[0].id)
        }
        setLoadingEntities(false)
      })
  }, [])

  const loadAttrs = useCallback(async (entityId: string) => {
    setLoadingAttrs(true)
    const res = await fetch(`/api/ontology/attributes?entityId=${entityId}`)
    const data = await res.json()
    if (data.success) setAttributes(data.data)
    setLoadingAttrs(false)
  }, [])

  useEffect(() => {
    if (selectedEntityId) loadAttrs(selectedEntityId)
  }, [selectedEntityId, loadAttrs])

  function startEdit(attr: OntologyAttribute) {
    setEditingId(attr.id)
    setEditData({
      displayName: attr.displayName,
      description: attr.description ?? "",
      isRequired: attr.isRequired,
      enumOptions: attr.enumOptions?.join(", ") ?? "",
    })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/ontology/attributes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editData.displayName,
          description: editData.description || undefined,
          isRequired: editData.isRequired,
          enumOptions: editData.enumOptions
            ? editData.enumOptions.split(",").map((s) => s.trim()).filter(Boolean)
            : null,
        }),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Attribute updated")
      setEditingId(null)
      if (selectedEntityId) await loadAttrs(selectedEntityId)
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this attribute?")) return
    const res = await fetch(`/api/ontology/attributes/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (data.success) {
      toast.success("Attribute deleted")
      if (selectedEntityId) await loadAttrs(selectedEntityId)
    } else {
      toast.error(data.message ?? "Failed to delete")
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attributes</h1>
        <p className="text-sm text-gray-500 mt-1">View and edit attributes for each entity.</p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-gray-500">Select Entity</Label>
        {loadingEntities ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
          >
            {entities.map((e) => (
              <option key={e.id} value={e.id}>{e.displayName}</option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loadingAttrs ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : attributes.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No attributes for this entity.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                <th className="text-left px-5 py-3">Display Name</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Required</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attributes.map((attr) => (
                <Fragment key={attr.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{attr.displayName}</span>
                        {attr.isSystem && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                            <Shield className="h-2.5 w-2.5" /> sys
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{attr.name}</td>
                    <td className="px-4 py-3">{dataTypeBadge(attr.dataType)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{attr.isRequired ? "✓" : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => startEdit(attr)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors mr-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                  {editingId === attr.id && (
                    <tr key={`${attr.id}-edit`} className="bg-gray-50">
                      <td colSpan={5} className="px-5 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Display Name</Label>
                              <Input
                                value={editData.displayName}
                                onChange={(e) => setEditData((p) => ({ ...p, displayName: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={editData.description}
                                onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                                placeholder="Optional"
                              />
                            </div>
                          </div>
                          {attr.dataType === "select" && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">Enum Options (comma-separated)</Label>
                              <Input
                                value={editData.enumOptions}
                                onChange={(e) => setEditData((p) => ({ ...p, enumOptions: e.target.value }))}
                                placeholder="option1, option2, option3"
                              />
                            </div>
                          )}
                          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editData.isRequired}
                              onChange={(e) => setEditData((p) => ({ ...p, isRequired: e.target.checked }))}
                              className="rounded"
                            />
                            Required
                          </label>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(attr.id)} disabled={saving}>
                              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3 mr-1" /> Cancel
                            </Button>
                            {!attr.isSystem && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="ml-auto text-red-600 border-red-200 hover:text-red-700"
                                onClick={() => handleDelete(attr.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
