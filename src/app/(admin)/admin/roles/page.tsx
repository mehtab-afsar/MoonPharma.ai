"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Pencil, Check, X } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  production_head: "Production Head",
  supervisor: "Supervisor",
  operator: "Operator",
  qa_reviewer: "QA Reviewer",
  qa_head: "QA Head",
}

const ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

type User = { id: string; fullName: string; email: string; employeeId: string; role: string; department: string | null; isActive: boolean }

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

export default function RolesPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    const res = await fetch("/api/users").then(r => r.json())
    if (res.success) setUsers(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  function startEdit(user: User) {
    setEditingId(user.id)
    setSelectedRole(user.role)
  }

  function cancelEdit() {
    setEditingId(null)
    setSelectedRole("")
  }

  async function saveRole(userId: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      }).then(r => r.json())
      if (!res.success) { toast.error(res.message ?? "Failed to update role"); return }
      toast.success("Role assigned")
      setEditingId(null)
      reload()
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Role Assignment</h1>
        <p className="text-sm text-gray-500 mt-0.5">Assign and manage roles for each team member.</p>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-sm text-gray-400">
            No team members yet. Add members from Team Management first.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                <th className="text-left px-5 py-3">Member</th>
                <th className="text-left px-4 py-3">Employee ID</th>
                <th className="text-left px-4 py-3">Department</th>
                <th className="text-left px-4 py-3">Current Role</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => {
                const isEditing = editingId === user.id
                const isSelf = user.id === session?.user?.id
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${user.isActive ? "bg-gray-900" : "bg-gray-300"}`}>
                          {initials(user.fullName)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{user.employeeId}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select
                          value={selectedRole}
                          onChange={e => setSelectedRole(e.target.value)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-black"
                          autoFocus
                        >
                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md border border-gray-200">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.isActive ? "bg-gray-50 text-gray-700 border-gray-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isSelf ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : isEditing ? (
                        <div className="flex items-center gap-1.5 justify-end">
                          <Button size="sm" onClick={() => saveRole(user.id)} disabled={saving} className="h-7 px-2.5 text-xs">
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="h-3 w-3 mr-1" />Save</>}
                          </Button>
                          <button onClick={cancelEdit} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(user)}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-md px-2.5 py-1 hover:border-gray-400 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Assign Role
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">Your own role cannot be changed from this screen.</p>
    </div>
  )
}
