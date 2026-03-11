"use client"

import React from "react"
import { Shield } from "lucide-react"

const roles = [
  { key: "admin", label: "Admin" },
  { key: "production_supervisor", label: "Prod. Supervisor" },
  { key: "production_operator", label: "Operator" },
  { key: "qa_reviewer", label: "QA Reviewer" },
  { key: "qa_head", label: "QA Head" },
  { key: "viewer", label: "Viewer" },
]

const permissions = [
  {
    group: "Batch Records",
    items: [
      { label: "View batches", allowed: ["admin", "production_supervisor", "production_operator", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create batch", allowed: ["admin", "production_supervisor"] },
      { label: "Execute steps", allowed: ["admin", "production_supervisor", "production_operator"] },
      { label: "Complete batch", allowed: ["admin", "production_supervisor"] },
    ],
  },
  {
    group: "Master Batch Records",
    items: [
      { label: "View MBR", allowed: ["admin", "production_supervisor", "production_operator", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create MBR", allowed: ["admin", "qa_head"] },
      { label: "Edit MBR", allowed: ["admin", "qa_head"] },
      { label: "Approve MBR", allowed: ["admin", "qa_head"] },
    ],
  },
  {
    group: "Quality Review",
    items: [
      { label: "Submit for review", allowed: ["admin", "production_supervisor"] },
      { label: "Perform QA review", allowed: ["admin", "qa_reviewer", "qa_head"] },
      { label: "Final QA approval", allowed: ["admin", "qa_head"] },
    ],
  },
  {
    group: "Deviations",
    items: [
      { label: "View deviations", allowed: ["admin", "production_supervisor", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create deviation", allowed: ["admin", "production_supervisor", "qa_reviewer", "qa_head"] },
      { label: "Investigate & close", allowed: ["admin", "qa_reviewer", "qa_head"] },
    ],
  },
  {
    group: "Products & Materials",
    items: [
      { label: "View products", allowed: ["admin", "production_supervisor", "production_operator", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create/edit products", allowed: ["admin", "qa_head"] },
      { label: "View materials", allowed: ["admin", "production_supervisor", "production_operator", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create/edit materials", allowed: ["admin", "production_supervisor", "qa_head"] },
    ],
  },
  {
    group: "Equipment",
    items: [
      { label: "View equipment", allowed: ["admin", "production_supervisor", "production_operator", "qa_reviewer", "qa_head", "viewer"] },
      { label: "Create/edit equipment", allowed: ["admin", "production_supervisor"] },
    ],
  },
  {
    group: "Administration",
    items: [
      { label: "Audit trail access", allowed: ["admin", "qa_reviewer", "qa_head"] },
      { label: "Manage team", allowed: ["admin"] },
      { label: "Configure workflow", allowed: ["admin"] },
      { label: "Manage categories", allowed: ["admin"] },
      { label: "View reports", allowed: ["admin", "qa_head"] },
    ],
  },
]

function Cell({ allowed }: { allowed: boolean }) {
  return (
    <td className="px-4 py-3 text-center">
      {allowed ? (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-xs font-bold">✓</span>
      ) : (
        <span className="text-gray-300 text-lg leading-none">—</span>
      )}
    </td>
  )
}

export default function RolesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
          <Shield className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Role Permissions</h1>
          <p className="text-sm text-gray-500">Permission matrix for all roles in the system</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Role permissions are fixed by the system. Contact support to request custom role configurations.
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-4 py-3 text-left font-medium">Permission</th>
                {roles.map((r) => (
                  <th key={r.key} className="px-4 py-3 text-center font-medium whitespace-nowrap">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((group) => (
                <React.Fragment key={group.group}>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {group.group}
                    </td>
                  </tr>
                  {group.items.map((item, idx) => (
                    <tr key={item.label} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-4 py-3 text-gray-700">{item.label}</td>
                      {roles.map((r) => (
                        <Cell key={r.key} allowed={item.allowed.includes(r.key)} />
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-xs">✓</span>
          Allowed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-gray-300 text-base leading-none">—</span>
          Not allowed
        </span>
      </div>
    </div>
  )
}
