"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Plus, ArrowLeft, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/shared/constants/routes"

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "production_head", label: "Production Head" },
  { value: "supervisor", label: "Supervisor" },
  { value: "operator", label: "Operator" },
  { value: "qa_reviewer", label: "QA Reviewer" },
  { value: "qa_head", label: "QA Head" },
] as const

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  production_head: "Production Head",
  supervisor: "Supervisor",
  operator: "Operator",
  qa_reviewer: "QA Reviewer",
  qa_head: "QA Head",
}

const addUserSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  employeeId: z.string().min(1, "Employee ID required"),
  role: z.enum(["admin", "production_head", "supervisor", "operator", "qa_reviewer", "qa_head"]),
  designation: z.string().optional(),
  password: z.string().min(8, "Min 8 characters"),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "Digits only"),
})

type AddUserForm = z.infer<typeof addUserSchema>

type User = {
  id: string
  fullName: string
  email: string
  employeeId: string
  role: string
  designation: string | null
  isActive: boolean
  createdAt: string
}

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddUserForm>({
    resolver: zodResolver(addUserSchema),
    defaultValues: { role: "operator" },
  })

  const fetchUsers = async () => {
    const res = await fetch("/api/users")
    const result = await res.json()
    if (result.success) setUsers(result.data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const onAdd = async (data: AddUserForm) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      toast.success(`${data.fullName} added to the team`)
      reset()
      setShowForm(false)
      fetchUsers()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add user")
    } finally {
      setSubmitting(false)
    }
  }

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={ROUTES.SETTINGS} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Add team members and manage access roles.</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4" /> : <><Plus className="h-4 w-4 mr-1.5" /> Add User</>}
          </Button>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <form onSubmit={handleSubmit(onAdd)} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">New Team Member</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input placeholder="Dr. Jane Smith" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Employee ID *</Label>
              <Input placeholder="EMP-002" {...register("employeeId")} />
              {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email *</Label>
            <Input type="email" placeholder="jane@company.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Role *</Label>
              <select {...register("role")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Designation</Label>
              <Input placeholder="e.g. QC Chemist" {...register("designation")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Password *</Label>
              <Input type="password" placeholder="Min 8 characters" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">4-Digit PIN *</Label>
              <Input type="password" maxLength={4} placeholder="e.g. 1234" {...register("pin")} />
              {errors.pin && <p className="text-xs text-red-500">{errors.pin.message}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-400">The PIN is used for e-signature during batch execution.</p>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create User Account
          </Button>
        </form>
      )}

      {/* User List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No users found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Employee ID</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {initials(user.fullName)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user.employeeId}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full border border-gray-200">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${user.isActive ? "bg-gray-50 text-gray-700 border-gray-200" : "bg-gray-100 text-gray-400 border-gray-200"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
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
