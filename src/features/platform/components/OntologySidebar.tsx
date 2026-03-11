"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { LayoutDashboard, Database, Tag, GitFork, GitMerge, Network, ShieldCheck, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/ontology",               label: "Overview",       icon: LayoutDashboard, exact: true },
  { href: "/ontology/entities",      label: "Entities",       icon: Database },
  { href: "/ontology/attributes",    label: "Attributes",     icon: Tag },
  { href: "/ontology/relationships", label: "Relationships",  icon: GitFork },
  { href: "/ontology/lifecycles",    label: "Lifecycles",     icon: GitMerge },
  { href: "/ontology/process-graph", label: "Process Graph",  icon: Network },
  { href: "/ontology/constraints",   label: "Constraints",    icon: ShieldCheck },
]

export function OntologySidebar() {
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
          <span className="text-xs font-bold text-white">O</span>
        </div>
        {open && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm tracking-tight whitespace-nowrap">MoonPharma</p>
            <p className="text-white/40 text-xs whitespace-nowrap">Ontology</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-0.5 transition-all duration-200", open ? "px-3" : "px-2")}>
        {/* Back to Platform */}
        <Link
          href="/platform"
          title={!open ? "Back to Platform" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors mb-1",
            open ? "gap-2.5 px-3 py-2" : "justify-center px-2 py-2.5"
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {open && <span className="whitespace-nowrap">Back to Platform</span>}
        </Link>

        <div className="my-1 border-t border-white/10" />

        {navItems.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
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
