"use client"

import { signOut, useSession } from "next-auth/react"
import { Bell, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ROLE_LABELS } from "@/shared/constants/roles"
import { UserRole } from "@/generated/prisma"
import Link from "next/link"
import { ROUTES } from "@/shared/constants/routes"

const ROLE_SHORT: Record<string, string> = {
  admin: "Admin",
  production_head: "Prod Head",
  supervisor: "Supervisor",
  operator: "Operator",
  qa_reviewer: "QA Reviewer",
  qa_head: "QA Head",
}

export function AppHeader() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ""
  const initials = session?.user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("") ?? "U"

  return (
    <header className="header-enter relative h-16 border-b border-black/[0.08] bg-white flex items-center justify-between px-6 flex-shrink-0">
      {/* Left — empty */}
      <div />

      {/* Center — Role badge */}
      <div className="absolute left-1/2 -translate-x-1/2">
        {role && (
          <span className="inline-flex items-center rounded border border-black px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[1px] text-black select-none">
            {ROLE_SHORT[role] ?? role.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Right — Bell + Avatar */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-black hover:bg-gray-100 rounded-lg btn-press"
        >
          <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 h-9 px-2 hover:bg-gray-100 rounded-lg btn-press"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                <span className="text-[12px] font-semibold text-white tracking-tight">
                  {initials}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:block text-gray-900 max-w-[120px] truncate">
                {session?.user?.fullName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 border-black/10 shadow-lg">
            <div className="px-3 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">{session?.user?.fullName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ROLE_LABELS[session?.user?.role as UserRole] ?? session?.user?.role}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ROUTES.SETTINGS} className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
