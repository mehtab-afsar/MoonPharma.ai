import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

const ROLES = [
  {
    role: "Admin",
    description: "Full system access. Manages users, org settings, and all records.",
    permissions: ["Manage users", "Edit org profile", "Approve MBRs", "Execute batches", "Review & approve batches", "View audit trail"],
  },
  {
    role: "Production Head",
    description: "Oversees manufacturing. Can initiate batches and execute steps.",
    permissions: ["Initiate batches", "Execute batch steps", "View all records", "Log deviations"],
  },
  {
    role: "Supervisor",
    description: "Supervises batch execution and verifies steps.",
    permissions: ["Execute batch steps", "Verify step completion", "Log deviations", "View records"],
  },
  {
    role: "Operator",
    description: "Executes individual batch steps on the shop floor.",
    permissions: ["Execute batch steps", "Record parameters", "Record IPC results"],
  },
  {
    role: "QA Reviewer",
    description: "Reviews completed batches for GMP compliance.",
    permissions: ["Review batches (stage 1)", "Log deviations", "View all records", "Add review comments"],
  },
  {
    role: "QA Head",
    description: "Final approver for batch release and MBR approval.",
    permissions: ["Approve/reject batches (final)", "Approve MBRs", "Close deviations", "Full read access"],
  },
]

export default function RolesPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Link href={ROUTES.SETTINGS} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-1">Role hierarchy and access levels in the eBMR system.</p>
      </div>

      <div className="space-y-3">
        {ROLES.map((r) => (
          <div key={r.role} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{r.role}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{r.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.permissions.map(p => (
                    <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
