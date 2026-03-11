"use client"

import Link from "next/link"
import { Check, ChevronRight, X } from "lucide-react"
import { useState } from "react"

type Props = {
  hasProduct: boolean
  hasMaterial: boolean
  hasEquipment: boolean
  hasMBR: boolean
  hasTeam: boolean
}

const STEPS = [
  {
    key: "hasTeam" as keyof Props,
    label: "Add your first team member",
    description: "Operators, supervisors, and QA reviewers",
    href: "/settings/users",
  },
  {
    key: "hasProduct" as keyof Props,
    label: "Register a product",
    description: "Add the drug product you manufacture",
    href: "/products",
  },
  {
    key: "hasMaterial" as keyof Props,
    label: "Add raw materials",
    description: "APIs, excipients, packaging materials",
    href: "/materials",
  },
  {
    key: "hasEquipment" as keyof Props,
    label: "Register equipment",
    description: "Manufacturing machines and tools",
    href: "/equipment",
  },
  {
    key: "hasMBR" as keyof Props,
    label: "Create your first MBR",
    description: "Master Batch Record with steps and parameters",
    href: "/mbr/new",
  },
]

export function OnboardingChecklist(props: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const completed = STEPS.filter(s => props[s.key]).length
  const total = STEPS.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-5 pb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900">Complete your setup</span>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{completed}/{total} done</span>
          </div>
          <p className="text-xs text-gray-500">Finish these steps to start executing batch manufacturing records.</p>
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden w-48">
            <div
              className="h-full bg-gray-900 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 ml-4 mt-0.5 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="border-t border-gray-100 divide-y divide-gray-50">
        {STEPS.map(step => {
          const done = props[step.key]
          return (
            <Link
              key={step.key}
              href={done ? "#" : step.href}
              className={`flex items-center gap-3 px-5 py-3 transition-colors ${done ? "opacity-50 cursor-default" : "hover:bg-gray-50 group"}`}
              onClick={done ? (e) => e.preventDefault() : undefined}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${done ? "bg-gray-900 border-gray-900" : "border-gray-300 group-hover:border-gray-500"}`}>
                {done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                  {step.label}
                </p>
                {!done && <p className="text-xs text-gray-400">{step.description}</p>}
              </div>
              {!done && <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-700 flex-shrink-0" />}
            </Link>
          )
        })}
      </div>

      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
        <Link
          href="/onboarding"
          className="text-xs font-medium text-gray-700 hover:text-gray-900 underline underline-offset-2"
        >
          Open setup wizard →
        </Link>
      </div>
    </div>
  )
}
