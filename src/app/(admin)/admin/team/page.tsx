"use client"

import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus, Copy, Check, Loader2, MoreVertical, X, Pencil, ChevronDown } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "production_head", label: "Production Head" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operator" },
  { value: "qa_reviewer", label: "QA Reviewer" },
  { value: "qa_head", label: "QA Head" },
] as const

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin", production_head: "Production Head", supervisor: "Supervisor",
  operator: "Operator", qa_reviewer: "QA Reviewer", qa_head: "QA Head",
}

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  fullName: z.string().min(2, "Name required"),
  employeeId: z.string().min(1, "Employee ID required"),
  role: z.enum(["production_head", "supervisor", "operator", "qa_reviewer", "qa_head"]),
  department: z.string().optional(),
})

const editSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.enum(["admin", "production_head", "supervisor", "operator", "qa_reviewer", "qa_head"]).optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
})

type User = { id: string; fullName: string; email: string; employeeId: string; role: string; designation: string | null; department: string | null; isActive: boolean; createdAt: string }
type Invitation = { id: string; fullName: string; email: string; role: string; status: string; expiresAt: string; isExpired: boolean; invitedBy: { fullName: string } }

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
}

function CopyLinkCard({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-700">Share this invitation link</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
      </div>
      <p className="text-xs text-gray-500 mb-3">This link expires in 7 days. Share it directly with the invitee.</p>
      <div className="flex gap-2">
        <input readOnly value={link} className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-700 select-all" />
        <button
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="flex items-center gap-1.5 text-xs bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
        </button>
      </div>
    </div>
  )
}

export default function AdminTeamPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<"members" | "invitations">("members")
  const [users, setUsers] = useState<User[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [roleChanging, setRoleChanging] = useState<string | null>(null)

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "operator" },
  })

  const editForm = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
  })

  const reload = useCallback(async () => {
    const [usersRes, invitesRes] = await Promise.all([
      fetch("/api/users").then(r => r.json()),
      fetch("/api/invitations").then(r => r.json()),
    ])
    if (usersRes.success) setUsers(usersRes.data)
    if (invitesRes.success) setInvitations(invitesRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  async function handleInvite(data: z.infer<typeof inviteSchema>) {
    setSubmitting(true)
    try {
      const res = await fetch("/api/invitations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) { toast.error(result.message ?? "Failed"); return }
      setInviteLink(result.data.inviteLink)
      toast.success(`Invitation created for ${data.fullName}`)
      inviteForm.reset()
      reload()
    } catch { toast.error("Something went wrong") }
    finally { setSubmitting(false) }
  }

  async function handleRevokeInvite(id: string) {
    const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" })
    const result = await res.json()
    if (result.success) { toast.success("Invitation revoked"); reload() }
    else toast.error(result.message ?? "Failed to revoke")
  }

  async function handleToggleStatus(user: User) {
    const res = await fetch(`/api/users/${user.id}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    })
    const result = await res.json()
    if (result.success) { toast.success(user.isActive ? "User deactivated" : "User activated"); reload() }
    else toast.error(result.message ?? "Failed")
    setOpenMenuId(null)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setRoleChanging(userId)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const result = await res.json()
      if (!result.success) { toast.error(result.message ?? "Failed to update role"); return }
      toast.success("Role updated")
      reload()
    } catch { toast.error("Something went wrong") }
    finally { setRoleChanging(null) }
  }

  async function handleEditSubmit(data: z.infer<typeof editSchema>) {
    if (!editingUser) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) { toast.error(result.message ?? "Failed"); return }
      toast.success("User updated")
      setEditingUser(null)
      reload()
    } catch { toast.error("Something went wrong") }
    finally { setSubmitting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members and send invitations.</p>
        </div>
        <Button size="sm" onClick={() => { setShowInviteForm(!showInviteForm); setInviteLink(null) }}>
          {showInviteForm ? <X className="h-4 w-4" /> : <><UserPlus className="h-4 w-4 mr-1.5" /> Invite Member</>}
        </Button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm font-semibold text-gray-900 mb-4">New Invitation</p>
          <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="Dr. Jane Smith" {...inviteForm.register("fullName")} />
                {inviteForm.formState.errors.fullName && <p className="text-xs text-red-500">{inviteForm.formState.errors.fullName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Employee ID *</Label>
                <Input placeholder="EMP-002" {...inviteForm.register("employeeId")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input type="email" placeholder="jane@company.com" {...inviteForm.register("email")} />
              {inviteForm.formState.errors.email && <p className="text-xs text-red-500">{inviteForm.formState.errors.email.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role *</Label>
                <select {...inviteForm.register("role")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Department</Label>
                <Input placeholder="e.g. Manufacturing" {...inviteForm.register("department")} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate Invitation Link
            </Button>
          </form>
          {inviteLink && <CopyLinkCard link={inviteLink} onClose={() => setInviteLink(null)} />}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditingUser(null)} />
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Edit {editingUser.fullName}</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Full Name</Label>
                <Input defaultValue={editingUser.fullName} {...editForm.register("fullName")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Role</Label>
                  <select defaultValue={editingUser.role} {...editForm.register("role")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
                    {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <Input defaultValue={editingUser.department ?? ""} {...editForm.register("department")} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Designation</Label>
                <Input defaultValue={editingUser.designation ?? ""} {...editForm.register("designation")} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Toggle */}
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 w-fit">
        {(["members", "invitations"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t === "members" ? `Members (${users.length})` : `Invitations (${invitations.filter(i => i.status === "pending" && !i.isExpired).length})`}
          </button>
        ))}
      </div>

      {/* Members Table */}
      {tab === "members" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Employee ID</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3">
                      {roleChanging === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                      ) : user.id === session?.user?.id ? (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                          {ROLE_LABELS[user.role] ?? user.role}
                        </span>
                      ) : (
                        <div className="relative inline-flex items-center">
                          <select
                            value={user.role}
                            onChange={e => handleRoleChange(user.id, e.target.value)}
                            className="appearance-none text-xs bg-gray-50 border border-gray-200 text-gray-700 rounded-full pl-2.5 pr-6 py-0.5 cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-black transition-colors"
                          >
                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-gray-400 pointer-events-none" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{user.department ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${user.isActive ? "bg-gray-50 text-gray-700 border-gray-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === user.id && (
                          <div className="absolute right-0 top-8 z-10 w-40 bg-white rounded-xl border border-gray-200 shadow-lg py-1">
                            <button
                              onClick={() => { setEditingUser(user); editForm.reset(); setOpenMenuId(null) }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {user.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invitations Table */}
      {tab === "invitations" && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">No invitations sent yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Invitee</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Expires</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{inv.fullName}</p>
                      <p className="text-xs text-gray-500">{inv.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        inv.status === "accepted" ? "bg-gray-900 text-white border-gray-900"
                        : inv.status === "revoked" || inv.isExpired ? "bg-gray-100 text-gray-400 border-gray-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}>
                        {inv.isExpired ? "Expired" : inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(inv.expiresAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === "pending" && !inv.isExpired && (
                        <button
                          onClick={() => handleRevokeInvite(inv.id)}
                          className="text-xs text-gray-500 hover:text-gray-900 underline"
                        >
                          Revoke
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
