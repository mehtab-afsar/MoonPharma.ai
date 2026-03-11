"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, Shield, Settings2, CreditCard,
  ArrowLeft, Hash, Workflow, Tag, ChevronDown, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/team", label: "Team", icon: Users },
  { href: "/admin/roles", label: "Roles", icon: Shield },
  {
    label: "Configuration",
    icon: Settings2,
    children: [
      { href: "/admin/config/numbering", label: "Numbering", icon: Hash },
      { href: "/admin/config/workflow", label: "Workflow", icon: Workflow },
      { href: "/admin/config/categories", label: "Categories", icon: Tag },
    ],
  },
  { href: "/admin/subscription", label: "Subscription", icon: CreditCard },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [configOpen, setConfigOpen] = useState(pathname.startsWith("/admin/config"))

  return (
    <div className="w-60 shrink-0 bg-gray-950 flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <p className="text-white font-bold text-sm tracking-tight">MoonPharma</p>
        <p className="text-white/40 text-xs mt-0.5">Admin Console</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map((item) => {
          if ("children" in item) {
            const isActive = pathname.startsWith("/admin/config")
            return (
              <div key="config">
                <button
                  onClick={() => setConfigOpen(v => !v)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                    isActive ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {configOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                {configOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 pl-3 border-l border-white/10">
                    {item.children!.map(child => {
                      const active = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
                            active ? "text-white bg-white/10" : "text-white/40 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "text-white bg-white/10" : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Back to App */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to eBMR App
        </Link>
      </div>
    </div>
  )
}
