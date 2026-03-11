"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Shield, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"

const ROLES = [
  { key: "admin", label: "Admin" },
  { key: "production_head", label: "Prod. Head" },
  { key: "supervisor", label: "Supervisor" },
  { key: "operator", label: "Operator" },
  { key: "qa_reviewer", label: "QA Reviewer" },
  { key: "qa_head", label: "QA Head" },
]

const PERMISSION_GROUPS = [
  {
    group: "Batch Records",
    items: [
      { key: "batch.view", label: "View batches" },
      { key: "batch.create", label: "Create batch" },
      { key: "batch.execute", label: "Execute steps" },
      { key: "batch.complete", label: "Complete batch" },
    ],
  },
  {
    group: "Master Batch Records",
    items: [
      { key: "mbr.view", label: "View MBR" },
      { key: "mbr.create", label: "Create MBR" },
      { key: "mbr.edit", label: "Edit MBR" },
      { key: "mbr.approve", label: "Approve MBR" },
    ],
  },
  {
    group: "Quality Review",
    items: [
      { key: "review.submit", label: "Submit for review" },
      { key: "review.qa", label: "Perform QA review" },
      { key: "review.approve", label: "Final QA approval" },
    ],
  },
  {
    group: "Deviations",
    items: [
      { key: "deviation.view", label: "View deviations" },
      { key: "deviation.create", label: "Create deviation" },
      { key: "deviation.close", label: "Investigate & close" },
    ],
  },
  {
    group: "Products & Materials",
    items: [
      { key: "product.view", label: "View products" },
      { key: "product.edit", label: "Create/edit products" },
      { key: "material.view", label: "View materials" },
      { key: "material.edit", label: "Create/edit materials" },
    ],
  },
  {
    group: "Equipment",
    items: [
      { key: "equipment.view", label: "View equipment" },
      { key: "equipment.edit", label: "Create/edit equipment" },
    ],
  },
  {
    group: "Administration",
    items: [
      { key: "audit.view", label: "Audit trail access" },
      { key: "team.manage", label: "Manage team" },
      { key: "config.edit", label: "Configure workflow" },
      { key: "categories.manage", label: "Manage categories" },
      { key: "reports.view", label: "View reports" },
    ],
  },
]

// Default permissions applied when no saved config exists
const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSION_GROUPS.flatMap(g => g.items.map(i => i.key)),
  production_head: ["batch.view", "batch.create", "batch.execute", "batch.complete", "mbr.view", "review.submit", "deviation.view", "deviation.create", "product.view", "material.view", "material.edit", "equipment.view", "equipment.edit"],
  supervisor: ["batch.view", "batch.execute", "mbr.view", "review.submit", "deviation.view", "deviation.create", "product.view", "material.view", "equipment.view"],
  operator: ["batch.view", "batch.execute", "mbr.view", "deviation.view", "product.view", "material.view", "equipment.view"],
  qa_reviewer: ["batch.view", "mbr.view", "review.qa", "deviation.view", "deviation.create", "deviation.close", "product.view", "material.view", "equipment.view", "audit.view", "reports.view"],
  qa_head: ["batch.view", "batch.create", "mbr.view", "mbr.create", "mbr.edit", "mbr.approve", "review.qa", "review.approve", "deviation.view", "deviation.create", "deviation.close", "product.view", "product.edit", "material.view", "material.edit", "equipment.view", "audit.view", "reports.view"],
}

type PermissionMap = Record<string, string[]>

export default function RolesPage() {
  const [permissions, setPermissions] = useState<PermissionMap>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/config/role-permissions").then(r => r.json())
    if (res.success && res.data.rolePermissions) {
      setPermissions(res.data.rolePermissions as PermissionMap)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function toggle(role: string, permKey: string) {
    setPermissions(prev => {
      const current = prev[role] ?? []
      const next = current.includes(permKey)
        ? current.filter(p => p !== permKey)
        : [...current, permKey]
      return { ...prev, [role]: next }
    })
    setDirty(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/config/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rolePermissions: permissions }),
      }).then(r => r.json())
      if (!res.success) { toast.error(res.message ?? "Failed to save"); return }
      toast.success("Role permissions saved")
      setDirty(false)
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Role Permissions</h1>
            <p className="text-sm text-gray-500">Configure what each role can do in your organisation</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
          Save Changes
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-4 py-3 text-left font-medium w-52">Permission</th>
                {ROLES.map(r => (
                  <th key={r.key} className="px-3 py-3 text-center font-medium whitespace-nowrap">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_GROUPS.map(group => (
                <>
                  <tr key={group.group} className="bg-gray-50">
                    <td colSpan={ROLES.length + 1} className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group.group}
                    </td>
                  </tr>
                  {group.items.map((item, idx) => (
                    <tr key={item.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-2.5 text-gray-700 text-xs">{item.label}</td>
                      {ROLES.map(role => {
                        const checked = (permissions[role.key] ?? []).includes(item.key)
                        const isAdmin = role.key === "admin"
                        return (
                          <td key={role.key} className="px-3 py-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={isAdmin}
                              onChange={() => !isAdmin && toggle(role.key, item.key)}
                              className="w-4 h-4 rounded border-gray-300 text-black accent-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">Admin always has full access and cannot be restricted.</p>
    </div>
  )
}
