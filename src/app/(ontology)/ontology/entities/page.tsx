"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Plus, Loader2, Shield, ArrowRight, FlaskConical, Package, Wrench, FileText, Layers, AlertTriangle, User as UserIcon, Database, LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type OntologyEntity = {
  id: string
  name: string
  displayName: string
  pluralLabel: string
  description: string | null
  icon: string | null
  isSystem: boolean
  sortOrder: number
  group: string
  color: string | null
  prismaModel: string | null
  appRoute: string | null
  hasLifecycle: boolean
  isVersioned: boolean
}

const ICON_MAP: Record<string, LucideIcon> = {
  FlaskConical,
  Package,
  Wrench,
  FileText,
  Layers,
  AlertTriangle,
  User: UserIcon,
  Database,
}

function EntityIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return null
  const Icon = ICON_MAP[name]
  if (!Icon) return null
  return <Icon className={className ?? "h-5 w-5 text-gray-600"} />
}

const GROUP_ORDER = ["master_data", "operations", "quality", "people", "documents"]
const GROUP_LABELS: Record<string, string> = {
  master_data: "Master Data",
  operations: "Operations",
  quality: "Quality",
  people: "People",
  documents: "Documents",
}

function autoSlug(val: string) {
  return val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
}

export default function EntitiesPage() {
  const [entities, setEntities] = useState<OntologyEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEntity, setShowAddEntity] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newEntity, setNewEntity] = useState({
    name: "",
    displayName: "",
    pluralLabel: "",
    group: "master_data",
    description: "",
    icon: "",
  })

  const loadEntities = useCallback(async () => {
    const res = await fetch("/api/ontology/entities")
    const data = await res.json()
    if (data.success) setEntities(data.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadEntities() }, [loadEntities])

  async function handleCreateEntity() {
    if (!newEntity.name || !newEntity.displayName) {
      toast.error("Name and Display Name are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/ontology/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEntity.name,
          displayName: newEntity.displayName,
          description: newEntity.description || undefined,
          icon: newEntity.icon || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Entity created")
      setNewEntity({ name: "", displayName: "", pluralLabel: "", group: "master_data", description: "", icon: "" })
      setShowAddEntity(false)
      await loadEntities()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  const grouped = GROUP_ORDER.reduce<Record<string, OntologyEntity[]>>((acc, g) => {
    acc[g] = entities.filter((e) => e.group === g)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Domain objects and their attributes</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddEntity(!showAddEntity)}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Entity
        </Button>
      </div>

      {/* Add Entity Form */}
      {showAddEntity && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">New Entity</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Display Name *</Label>
              <Input
                placeholder="e.g. Batch Record"
                value={newEntity.displayName}
                onChange={(e) => {
                  const v = e.target.value
                  setNewEntity((p) => ({ ...p, displayName: v, name: autoSlug(v), pluralLabel: v + "s" }))
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Name (slug) *</Label>
              <Input
                placeholder="e.g. batch_record"
                value={newEntity.name}
                onChange={(e) => setNewEntity((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Plural Label</Label>
              <Input
                placeholder="e.g. Batch Records"
                value={newEntity.pluralLabel}
                onChange={(e) => setNewEntity((p) => ({ ...p, pluralLabel: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Group</Label>
              <select
                value={newEntity.group}
                onChange={(e) => setNewEntity((p) => ({ ...p, group: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
              >
                {GROUP_ORDER.map((g) => (
                  <option key={g} value={g}>{GROUP_LABELS[g]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                placeholder="Optional"
                value={newEntity.description}
                onChange={(e) => setNewEntity((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Icon (emoji)</Label>
              <Input
                placeholder="e.g. 📦"
                value={newEntity.icon}
                onChange={(e) => setNewEntity((p) => ({ ...p, icon: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateEntity} disabled={saving} className="bg-black text-white hover:bg-gray-800">
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
              Create Entity
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddEntity(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Groups */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {GROUP_ORDER.map((group) => {
            const groupEntities = grouped[group] ?? []
            if (groupEntities.length === 0) return null
            return (
              <div key={group}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  {GROUP_LABELS[group]} · {groupEntities.length} {groupEntities.length === 1 ? "entity" : "entities"}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {groupEntities.map((entity) => (
                    <EntityCard key={entity.id} entity={entity} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EntityCard({ entity }: { entity: OntologyEntity }) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow"
      style={{ borderLeftWidth: 3, borderLeftColor: entity.color ?? "#e5e7eb" }}
    >
      <div className="p-4 space-y-3">
        {/* Top */}
        <div className="flex items-start gap-2.5">
          {entity.icon && (
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
              <EntityIcon name={entity.icon} className="h-4 w-4 text-gray-600" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{entity.displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{entity.pluralLabel}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
            {entity.group.replace(/_/g, " ")}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
            {entity.isSystem ? (
              <><Shield className="h-2.5 w-2.5" /> System</>
            ) : (
              "Custom"
            )}
          </span>
          {entity.isVersioned && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
              Versioned
            </span>
          )}
          {entity.hasLifecycle && (
            <span className="text-xs flex items-center gap-1 text-gray-600">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Has lifecycle
            </span>
          )}
        </div>

        {/* Prisma / Route chips */}
        {(entity.prismaModel || entity.appRoute) && (
          <div className="flex flex-wrap gap-1.5">
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

        {/* Description */}
        {entity.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{entity.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-4 py-2.5">
        <Link
          href={`/ontology/entities/${entity.id}`}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
        >
          View Details <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}
