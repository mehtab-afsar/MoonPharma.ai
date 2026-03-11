"use client"

import { useState, useEffect, useCallback } from "react"
import { Tags, Plus, Trash2, ChevronUp, ChevronDown, RefreshCw } from "lucide-react"

const CATEGORY_TYPES = [
  { value: "material_type", label: "Material Types" },
  { value: "equipment_type", label: "Equipment Types" },
  { value: "deviation_category", label: "Deviation Categories" },
  { value: "area_class", label: "Area Classes" },
] as const

type CategoryType = (typeof CATEGORY_TYPES)[number]["value"]

interface Category {
  id: string
  categoryType: string
  value: string
  label: string
  isSystem: boolean
  isActive: boolean
  sortOrder: number
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
}

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>("material_type")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // New category form
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newValue, setNewValue] = useState("")
  const [addError, setAddError] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/config/categories?type=${activeTab}`)
      if (res.ok) {
        const { data } = await res.json()
        setCategories(data)
      }
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    load()
  }, [load])

  async function handleSeed() {
    setSeeding(true)
    try {
      await fetch("/api/config/seed", { method: "POST" })
      await load()
    } finally {
      setSeeding(false)
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/config/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    await load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return
    await fetch(`/api/config/categories/${id}`, { method: "DELETE" })
    await load()
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const idx = categories.findIndex((c) => c.id === id)
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === categories.length - 1) return
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    const current = categories[idx]
    const swap = categories[swapIdx]
    await Promise.all([
      fetch(`/api/config/categories/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: swap.sortOrder }),
      }),
      fetch(`/api/config/categories/${swap.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ])
    await load()
  }

  async function handleAdd() {
    setAddError("")
    if (!newLabel.trim()) { setAddError("Label is required"); return }
    const value = newValue || slugify(newLabel)
    if (!value) { setAddError("Value is required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/config/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryType: activeTab, label: newLabel.trim(), value }),
      })
      const json = await res.json()
      if (!res.ok) {
        setAddError(json.error || "Failed to add category")
      } else {
        setAdding(false)
        setNewLabel("")
        setNewValue("")
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
            <Tags className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Lookup Categories</h1>
            <p className="text-sm text-gray-500">Manage plant-specific values used in dropdown selectors</p>
          </div>
        </div>
        <button
          onClick={handleSeed}
          disabled={seeding}
          className="text-xs text-gray-400 hover:text-gray-700 underline"
        >
          {seeding ? "Seeding..." : "Seed defaults"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {CATEGORY_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.value
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-4 py-3 text-left font-medium">Label</th>
              <th className="px-4 py-3 text-left font-medium">Value</th>
              <th className="px-4 py-3 text-center font-medium">Type</th>
              <th className="px-4 py-3 text-center font-medium">Active</th>
              <th className="px-4 py-3 text-center font-medium">Order</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm animate-pulse">
                  Loading…
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No categories yet.{" "}
                  <button onClick={handleSeed} className="underline text-gray-600">Seed defaults</button> or add one below.
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
                <tr key={cat.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{cat.value}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cat.isSystem ? "bg-gray-100 text-gray-600" : "bg-black text-white"}`}>
                      {cat.isSystem ? "system" : "custom"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(cat.id, cat.isActive)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${cat.isActive ? "bg-black" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${cat.isActive ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleMove(cat.id, "up")} disabled={idx === 0} className="p-0.5 text-gray-400 hover:text-black disabled:opacity-20">
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleMove(cat.id, "down")} disabled={idx === categories.length - 1} className="p-0.5 text-gray-400 hover:text-black disabled:opacity-20">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {!cat.isSystem ? (
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-200 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add row */}
      {adding ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-900">Add new category</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Label (display name)</label>
              <input
                autoFocus
                value={newLabel}
                onChange={(e) => {
                  setNewLabel(e.target.value)
                  setNewValue(slugify(e.target.value))
                }}
                placeholder="e.g. Active Pharmaceutical Ingredient"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Value (stored key)</label>
              <input
                value={newValue}
                onChange={(e) => setNewValue(slugify(e.target.value))}
                placeholder="e.g. active_pharmaceutical_ingredient"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
          {addError && <p className="text-xs text-red-500">{addError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Add Category
            </button>
            <button
              onClick={() => { setAdding(false); setNewLabel(""); setNewValue(""); setAddError("") }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add category
        </button>
      )}
    </div>
  )
}
