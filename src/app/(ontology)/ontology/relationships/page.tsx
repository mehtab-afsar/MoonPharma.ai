"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Trash2, Shield, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OntologyEntity = {
  id: string
  name: string
  displayName: string
  icon: string | null
}

type OntologyRelationship = {
  id: string
  name: string
  displayName: string
  relationshipType: string
  isSystem: boolean
  description: string | null
  sourceEntity: OntologyEntity
  targetEntity: OntologyEntity
}

const RELATIONSHIP_TYPES = ["one_to_one", "one_to_many", "many_to_many"]

function relTypeBadge(type: string) {
  return (
    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 font-mono">
      {type.replace(/_/g, ":")}
    </span>
  )
}

export default function RelationshipsPage() {
  const [entities, setEntities] = useState<OntologyEntity[]>([])
  const [relationships, setRelationships] = useState<OntologyRelationship[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newRel, setNewRel] = useState({
    sourceEntityId: "",
    targetEntityId: "",
    relationshipType: "one_to_many",
    displayName: "",
    name: "",
  })

  function autoSlug(val: string) {
    return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [entRes, relRes] = await Promise.all([
      fetch("/api/ontology/entities").then((r) => r.json()),
      fetch("/api/ontology/relationships").then((r) => r.json()),
    ])
    if (entRes.success) {
      setEntities(entRes.data)
      if (entRes.data.length > 0) {
        setNewRel((p) => ({
          ...p,
          sourceEntityId: entRes.data[0].id,
          targetEntityId: entRes.data[0].id,
        }))
      }
    }
    if (relRes.success) setRelationships(relRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleCreate() {
    if (!newRel.displayName || !newRel.name || !newRel.sourceEntityId || !newRel.targetEntityId) {
      toast.error("All fields are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ontology/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRel),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Relationship created")
      setShowAddForm(false)
      setNewRel((p) => ({ ...p, displayName: "", name: "" }))
      await loadAll()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this relationship?")) return
    const res = await fetch(`/api/ontology/relationships/${id}`, { method: "DELETE" })
    const data = await res.json()
    if (data.success) {
      toast.success("Relationship deleted")
      await loadAll()
    } else {
      toast.error(data.message ?? "Failed to delete")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relationships</h1>
          <p className="text-sm text-gray-500 mt-1">Define how entities relate to each other.</p>
        </div>
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1.5" /> Add Relationship</>}
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-900">New Relationship</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Source Entity *</Label>
              <select
                value={newRel.sourceEntityId}
                onChange={(e) => setNewRel((p) => ({ ...p, sourceEntityId: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {entities.map((e) => <option key={e.id} value={e.id}>{e.displayName}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Entity *</Label>
              <select
                value={newRel.targetEntityId}
                onChange={(e) => setNewRel((p) => ({ ...p, targetEntityId: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {entities.map((e) => <option key={e.id} value={e.id}>{e.displayName}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Relationship Type *</Label>
            <select
              value={newRel.relationshipType}
              onChange={(e) => setNewRel((p) => ({ ...p, relationshipType: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              {RELATIONSHIP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name *</Label>
              <Input
                placeholder="e.g. Has Materials"
                value={newRel.displayName}
                onChange={(e) => {
                  const v = e.target.value
                  setNewRel((p) => ({ ...p, displayName: v, name: autoSlug(v) }))
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name (slug) *</Label>
              <Input
                placeholder="e.g. has_materials"
                value={newRel.name}
                onChange={(e) => setNewRel((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Relationship
          </Button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : relationships.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">No relationships defined yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                <th className="text-left px-5 py-3">Source</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {relationships.map((rel) => (
                <tr key={rel.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-900">
                      {rel.sourceEntity.icon && <span className="mr-1">{rel.sourceEntity.icon}</span>}
                      {rel.sourceEntity.displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3">{relTypeBadge(rel.relationshipType)}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {rel.targetEntity.icon && <span className="mr-1">{rel.targetEntity.icon}</span>}
                      {rel.targetEntity.displayName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">{rel.displayName}</span>
                      {rel.isSystem && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                          <Shield className="h-2.5 w-2.5" /> sys
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!rel.isSystem && (
                      <button
                        onClick={() => handleDelete(rel.id)}
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
  )
}
