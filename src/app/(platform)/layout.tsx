import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { PlatformSidebar } from "@/features/platform/components/PlatformSidebar"

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect("/login")
  if (session.user.role !== "admin") redirect("/dashboard")

  return (
    <div className="flex h-screen bg-gray-50">
      <PlatformSidebar />
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        {children}
      </main>
    </div>
  )
}
