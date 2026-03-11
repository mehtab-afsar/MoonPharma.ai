"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
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

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
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
    <aside
      className={cn(
        "app-sidebar min-h-screen bg-black border-r border-white/10 flex flex-col relative",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("border-b border-white/10 flex items-center", collapsed ? "p-4 justify-center" : "p-5 gap-2.5")}>
        <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
          <FlaskConical className="w-3.5 h-3.5 text-black" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">MoonPharma</p>
            <p className="text-xs text-white/40 whitespace-nowrap">eBMR System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-2 space-y-0.5 overflow-y-auto overflow-x-hidden", collapsed ? "px-2" : "p-3")}>
        {visibleItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                collapsed ? "px-2 py-2.5 justify-center" : "px-3 py-2",
                isActive
                  ? "bg-white text-black"
                  : "text-white/50 hover:text-white hover:bg-white/[0.08]"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <span className="sidebar-label truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Info */}
      {session?.user && (
        <div className={cn("border-t border-white/10", collapsed ? "p-2" : "p-3")}>
          <div className={cn("flex items-center rounded-lg px-2 py-1.5", collapsed ? "justify-center" : "gap-2.5")}>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs font-medium text-white truncate">
                  {session.user.fullName}
                </p>
                <p className="text-xs text-white/40 capitalize truncate">
                  {session.user.role?.replace(/_/g, " ")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] z-10 w-6 h-6 rounded-full bg-black border border-white/20 flex items-center justify-center hover:bg-white hover:border-black transition-colors duration-150 group"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-white group-hover:text-black" />
          : <ChevronLeft className="w-3 h-3 text-white group-hover:text-black" />
        }
      </button>
    </aside>
  )
}
