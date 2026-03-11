"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { LayoutDashboard, Users, Shield, Network, AppWindow, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/platform",              label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/platform/team",         label: "Team",         icon: Users },
  { href: "/platform/roles",        label: "Roles",        icon: Shield },
  { href: "/platform/subscription", label: "Subscription", icon: CreditCard },
]

export function PlatformSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

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
        "shrink-0 bg-gray-950 flex flex-col h-screen sticky top-0 overflow-hidden transition-all duration-200 ease-in-out",
        open ? "w-56" : "w-14"
      )}
    >
      {/* Brand */}
      <div className={cn("border-b border-white/10 flex items-center gap-2.5 py-5 transition-all duration-200", open ? "px-5" : "px-0 justify-center")}>
        <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">M</span>
        </div>
        {open && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm tracking-tight whitespace-nowrap">MoonPharma</p>
            <p className="text-white/40 text-xs whitespace-nowrap">Platform</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-0.5 transition-all duration-200", open ? "px-3" : "px-2")}>
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm transition-colors",
                open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
                active
                  ? "text-white bg-white/10"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {open && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}

        <div className="my-2 border-t border-white/10" />

        {/* Ontology */}
        <Link
          href="/ontology"
          title={!open ? "Ontology" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm transition-colors",
            open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
            pathname.startsWith("/ontology")
              ? "text-white bg-white/10"
              : "text-white/50 hover:text-white hover:bg-white/5"
          )}
        >
          <Network className="h-4 w-4 shrink-0" />
          {open && <span className="whitespace-nowrap">Ontology</span>}
        </Link>

        <div className="my-2 border-t border-white/10" />

        {/* Apps */}
        <Link
          href="/platform/apps"
          title={!open ? "Apps" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm transition-colors",
            open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5",
            pathname.startsWith("/platform/apps")
              ? "text-white bg-white/10"
              : "text-white/50 hover:text-white hover:bg-white/5"
          )}
        >
          <AppWindow className="h-4 w-4 shrink-0" />
          {open && <span className="whitespace-nowrap">Apps</span>}
        </Link>
      </nav>

      {/* User */}
      {session?.user && (
        <div className={cn("border-t border-white/10 transition-all duration-200", open ? "px-3 py-4" : "px-2 py-4")}>
          <div className={cn("flex items-center rounded-lg px-2 py-1.5", open ? "gap-2.5" : "justify-center")}>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
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
