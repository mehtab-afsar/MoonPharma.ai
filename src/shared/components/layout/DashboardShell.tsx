"use client"

import { AppSidebar } from "./AppSidebar"
import { AppHeader } from "./AppHeader"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50/30">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 p-8 overflow-auto page-enter">{children}</main>
      </div>
    </div>
  )
}
