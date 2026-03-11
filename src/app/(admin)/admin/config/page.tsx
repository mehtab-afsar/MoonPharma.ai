"use client"

import Link from "next/link"
import { Hash, GitBranch, Tags, FlaskConical, ArrowRight } from "lucide-react"

const sections = [
  {
    title: "Numbering Formats",
    description: "Configure batch, deviation, and change control number formats with prefix and reset rules.",
    href: "/admin/config/numbering",
    icon: Hash,
    detail: "e.g. B-2026-001",
  },
  {
    title: "Workflow Rules",
    description: "Set QA review stages, line clearance, e-signature method, and session timeout.",
    href: "/admin/config/workflow",
    icon: GitBranch,
    detail: "QA stages, e-sig, timeouts",
  },
  {
    title: "Lookup Categories",
    description: "Manage material types, equipment types, deviation categories, and area classes for your plant.",
    href: "/admin/config/categories",
    icon: Tags,
    detail: "Material types, Equipment types…",
  },
  {
    title: "Process Templates",
    description: "Define reusable manufacturing process templates with steps, parameters, and IPC checks to speed up MBR creation.",
    href: "/admin/config/processes",
    icon: FlaskConical,
    detail: "Wet Granulation, Compression, Coating…",
  },
]

export default function ConfigPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customise how MoonPharma eBMR works for your plant. Changes take effect immediately for new records.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center flex-shrink-0 group-hover:bg-gray-800 transition-colors">
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-black">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{s.description}</p>
                <p className="text-xs text-gray-400 mt-2 font-mono">{s.detail}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-700 transition-colors mt-1 flex-shrink-0" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Organization settings</span> (name, address, GMP certificate) are managed in{" "}
          <Link href="/settings/organization" className="underline hover:text-black">
            Settings → Organization
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
