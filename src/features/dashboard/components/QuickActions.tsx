"use client"

import Link from "next/link"
import { Plus, BookOpen, Eye, AlertTriangle, Bot, FileText } from "lucide-react"

interface ActionCard {
  label: string
  sublabel: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

export function QuickActions({ pendingReviewCount }: { pendingReviewCount: number }) {
  const actions: ActionCard[] = [
    {
      label: "New Batch",
      sublabel: "Start production",
      href: "/batches/new",
      icon: Plus,
    },
    {
      label: "Create MBR",
      sublabel: "Build a template",
      href: "/mbr/new",
      icon: BookOpen,
    },
    {
      label: "Review Queue",
      sublabel: "QA sign-off",
      href: "/review",
      icon: Eye,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    {
      label: "Log Deviation",
      sublabel: "Report an issue",
      href: "/deviations/new",
      icon: AlertTriangle,
    },
    {
      label: "AI Assistant",
      sublabel: "GMP guidance",
      href: "/ai-assistant",
      icon: Bot,
    },
    {
      label: "All Batches",
      sublabel: "View records",
      href: "/batches",
      icon: FileText,
    },
  ]

  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 snap-x snap-mandatory">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="action-card btn-press flex-shrink-0 snap-start w-[180px] h-[112px] bg-black rounded-xl p-4 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Badge */}
              {action.badge != null && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-white text-black text-[11px] font-bold flex items-center justify-center">
                  {action.badge}
                </span>
              )}

              {/* Icon */}
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-white" />
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-semibold text-white leading-tight">{action.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{action.sublabel}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
