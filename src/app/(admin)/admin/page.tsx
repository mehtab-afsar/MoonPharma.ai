import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/server/db/prisma"
import Link from "next/link"
import { Users, UserPlus, Settings2, ArrowRight, CreditCard, CheckCircle2, Circle } from "lucide-react"

async function getAdminStats(orgId: string) {
  const [userCount, pendingInvites, batchCount, hasConfig, categoryCount] = await Promise.all([
    prisma.user.count({ where: { orgId, isActive: true } }),
    prisma.invitation.count({ where: { orgId, status: "pending", expiresAt: { gt: new Date() } } }),
    prisma.batch.count({ where: { orgId, status: { in: ["in_progress", "under_review"] } } }),
    prisma.orgConfiguration.findUnique({ where: { orgId }, select: { id: true } }),
    prisma.lookupCategory.count({ where: { orgId } }),
  ])
  return { userCount, pendingInvites, batchCount, hasConfig: !!hasConfig, categoryCount }
}

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  const orgId = session!.user.orgId

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  const stats = await getAdminStats(orgId)

  const setupChecklist = [
    { done: stats.userCount > 1, label: "Invite at least one team member", href: "/admin/team" },
    { done: stats.hasConfig, label: "Configure workflow settings", href: "/admin/config/workflow" },
    { done: stats.categoryCount > 0, label: "Set up lookup categories", href: "/admin/config/categories" },
  ]
  const setupComplete = setupChecklist.every(c => c.done)

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{org?.name}</h1>
            <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full capitalize">
              {org?.subscriptionPlan}
            </span>
          </div>
          <p className="text-sm text-gray-500">Admin Console — Manage your team, roles, and platform configuration.</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Open eBMR App
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Setup checklist (shown until complete) */}
      {!setupComplete && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Complete your setup</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {setupChecklist.filter(c => c.done).length}/{setupChecklist.length} steps done
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {setupChecklist.map(item => (
              <Link
                key={item.href}
                href={item.done ? "#" : item.href}
                onClick={item.done ? e => e.preventDefault() : undefined}
                className={`flex items-center gap-3 px-5 py-3 ${item.done ? "opacity-50 cursor-default" : "hover:bg-gray-50 group"}`}
              >
                {item.done
                  ? <CheckCircle2 className="h-4 w-4 text-gray-700 shrink-0" />
                  : <Circle className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
                }
                <span className={`text-sm ${item.done ? "line-through text-gray-400" : "text-gray-700 font-medium"}`}>
                  {item.label}
                </span>
                {!item.done && <ArrowRight className="ml-auto h-3.5 w-3.5 text-gray-400 group-hover:text-gray-700" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Active Members", value: stats.userCount, icon: Users, href: "/admin/team" },
          { label: "Pending Invitations", value: stats.pendingInvites, icon: UserPlus, href: "/admin/team" },
          { label: "Active Batches", value: stats.batchCount, icon: Settings2, href: "/dashboard" },
        ].map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-900 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors">
                <stat.icon className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/admin/team", label: "Invite Team Member", desc: "Add operators, supervisors, QA staff", icon: UserPlus },
            { href: "/admin/config/workflow", label: "Workflow Settings", desc: "QA stages, line clearance, e-signature", icon: Settings2 },
            { href: "/admin/config/categories", label: "Manage Categories", desc: "Material types, equipment, deviation categories", icon: Settings2 },
            { href: "/admin/subscription", label: "Subscription & Limits", desc: "Plan, usage, user limits", icon: CreditCard },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-900 hover:shadow-sm transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-900 flex items-center justify-center transition-colors shrink-0 mt-0.5">
                <action.icon className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
