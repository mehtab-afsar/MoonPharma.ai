"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  FlaskConical,
  Cpu,
  FileText,
  Play,
  AlertTriangle,
  ClipboardCheck,
  ScrollText,
  Bot,
  BarChart3,
  Settings,
  ArrowLeft, // eslint-disable-line @typescript-eslint/no-unused-vars
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
  exact?: boolean
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true },
  { label: "Batches", href: ROUTES.BATCHES, icon: Play },
  { label: "Master Batch Records", href: ROUTES.MBR, icon: FileText },
  { label: "Review Queue", href: ROUTES.REVIEW_QUEUE, icon: ClipboardCheck, roles: ["qa_reviewer", "qa_head", "admin"] },
  { label: "Deviations", href: ROUTES.DEVIATIONS, icon: AlertTriangle },
  { label: "Products", href: ROUTES.PRODUCTS, icon: Package },
  { label: "Materials", href: ROUTES.MATERIALS, icon: FlaskConical },
  { label: "Equipment", href: ROUTES.EQUIPMENT, icon: Cpu },
  { label: "AI Assistant", href: ROUTES.AI_ASSISTANT, icon: Bot },
  { label: "Reports", href: ROUTES.REPORTS, icon: BarChart3 },
  { label: "Audit Trail", href: ROUTES.AUDIT_TRAIL, icon: ScrollText, roles: ["admin", "qa_head", "qa_reviewer"] },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings, roles: ["admin"] },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const role = session?.user?.role

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role ?? "")
  )

  const initials = session?.user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") ?? "U"

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className={cn(
        "shrink-0 bg-black flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-200 ease-in-out",
        open ? "w-60" : "w-14"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "border-b border-white/10 flex items-center transition-all duration-200",
        open ? "p-5 gap-2.5" : "p-0 py-5 justify-center"
      )}>
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-black" />
        </div>
        {open && (
          <div className="overflow-hidden">
            <p className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">MoonPharma</p>
            <p className="text-xs text-white/40 whitespace-nowrap">eBMR System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto py-3 space-y-0.5 transition-all duration-200",
        open ? "px-3" : "px-2"
      )}>
        {visibleItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-colors duration-150",
                open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
                isActive
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {open && <span className="truncate whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Back to Platform */}
      <div className={cn("px-2 pb-2", open && "px-3")}>
        <Link
          href="/platform"
          title={!open ? "Platform" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-colors duration-150 text-white/30 hover:text-white hover:bg-white/[0.08]",
            open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5"
          )}
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0" />
          {open && <span className="truncate whitespace-nowrap">Back to Platform</span>}
        </Link>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className={cn("border-t border-white/10", open ? "p-3" : "p-2")}>
          <div className={cn("flex items-center rounded-lg px-2 py-1.5", open ? "gap-2.5" : "justify-center")}>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            {open && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-white truncate">{session.user.fullName}</p>
                <p className="text-xs text-white/40 capitalize truncate">
                  {session.user.role?.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
