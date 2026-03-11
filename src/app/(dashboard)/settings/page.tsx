import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { Building2, Users, Shield, ChevronRight } from "lucide-react"

const SETTINGS_SECTIONS = [
  {
    href: "/settings/organization",
    icon: Building2,
    title: "Organization Profile",
    description: "Update your facility name, address, license number, and GMP certificate details.",
    adminOnly: false,
  },
  {
    href: "/settings/users",
    icon: Users,
    title: "User Management",
    description: "Add team members, manage roles, and control access to the system.",
    adminOnly: true,
  },
  {
    href: "/settings/roles",
    icon: Shield,
    title: "Roles & Permissions",
    description: "View the role hierarchy and access levels for each user type.",
    adminOnly: false,
  },
]

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "admin"

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organization configuration and team.</p>
      </div>

      <div className="space-y-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          const disabled = section.adminOnly && !isAdmin

          if (disabled) return null

          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors flex-shrink-0">
                <Icon className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{section.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 transition-colors flex-shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
