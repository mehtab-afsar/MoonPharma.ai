import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/server/db/prisma"
import Link from "next/link"
import {
  Users,
  Shield,
  Network,
  AppWindow,
  FlaskConical,
  Layers,
  AlertTriangle,
  ClipboardCheck,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Activity,
} from "lucide-react"

async function getPlatformStats(orgId: string) {
  const [
    teamCount,
    batchCounts,
    pendingReviews,
    openDeviations,
    entityCount,
    recentBatches,
  ] = await Promise.all([
    prisma.user.count({ where: { orgId, isActive: true } }),
    prisma.batch.groupBy({
      by: ["status"],
      where: { orgId },
      _count: { id: true },
    }),
    prisma.batchReview.count({
      where: { batch: { orgId }, status: "pending" },
    }),
    prisma.deviation.count({
      where: { batch: { orgId }, status: { in: ["open", "under_investigation"] } },
    }),
    prisma.ontologyEntity.count({ where: { orgId, isActive: true } }).catch(() => 0),
    prisma.batch.findMany({
      where: { orgId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        batchNumber: true,
        status: true,
        updatedAt: true,
        mbr: { select: { product: { select: { productName: true } } } },
      },
    }),
  ])

  const batchByStatus = Object.fromEntries(
    batchCounts.map((b) => [b.status, b._count.id])
  ) as Record<string, number>

  return {
    teamCount,
    totalBatches: batchCounts.reduce((s, b) => s + b._count.id, 0),
    activeBatches: (batchByStatus.in_progress ?? 0) + (batchByStatus.on_hold ?? 0),
    approvedBatches: batchByStatus.approved ?? 0,
    pendingReviews,
    openDeviations,
    entityCount,
    recentBatches,
  }
}

const STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress",
  on_hold: "On Hold",
  under_review: "Under Review",
  approved: "Approved",
  completed: "Completed",
  planned: "Planned",
  rejected: "Rejected",
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  sub?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4 hover:border-gray-400 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-black transition-colors">
        <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-600 shrink-0 mt-0.5 transition-colors" />
    </Link>
  )
}

export default async function PlatformDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const orgId = session.user.orgId
  const stats = await getPlatformStats(orgId)

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, subscriptionPlan: true },
  })

  return (
    <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Platform Overview</p>
          <h1 className="text-2xl font-bold text-gray-900">{org?.name ?? "Organization"}</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {org?.subscriptionPlan?.toLowerCase() ?? "starter"} plan — eagle view of your entire workspace
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Team Members" value={stats.teamCount} icon={Users} sub="active users" />
          <StatCard label="Total Batches" value={stats.totalBatches} icon={Layers} sub="all time" />
          <StatCard label="Pending Reviews" value={stats.pendingReviews} icon={ClipboardCheck} sub="awaiting QA" />
          <StatCard label="Open Deviations" value={stats.openDeviations} icon={AlertTriangle} sub="need attention" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard label="Active Batches" value={stats.activeBatches} icon={Activity} sub="in progress / on hold" />
          <StatCard label="Approved Batches" value={stats.approvedBatches} icon={TrendingUp} sub="released" />
          <StatCard label="Ontology Entities" value={stats.entityCount} icon={Network} sub="domain model entries" />
        </div>

        {/* Recent Batch Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Recent Batch Activity</h2>
            <Link href="/app/ebmr/batches" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {stats.recentBatches.length === 0 ? (
              <p className="text-sm text-gray-400 px-5 py-6">No batches yet.</p>
            ) : (
              stats.recentBatches.map((b) => (
                <Link
                  key={b.id}
                  href={`/app/ebmr/batches/${b.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.batchNumber}</p>
                    <p className="text-xs text-gray-400">
                      {b.mbr?.product?.productName ?? "—"} ·{" "}
                      {new Date(b.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                    {STATUS_LABELS[b.status] ?? b.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <QuickLink
              href="/platform/team"
              icon={Users}
              label="Team Management"
              description="Invite members, manage roles and access"
            />
            <QuickLink
              href="/platform/roles"
              icon={Shield}
              label="Role Permissions"
              description="View the permission matrix across all roles"
            />
            <QuickLink
              href="/ontology/entities"
              icon={Network}
              label="Ontology"
              description="Configure entities, attributes and relationships"
            />
            <QuickLink
              href="/platform/apps"
              icon={AppWindow}
              label="Applications"
              description="Launch eBMR and other connected apps"
            />
            <QuickLink
              href="/app/ebmr/batches"
              icon={FlaskConical}
              label="eBMR — Batches"
              description="Monitor and execute batch manufacturing records"
            />
            <QuickLink
              href="/platform/subscription"
              icon={CreditCard}
              label="Subscription"
              description="Plan details and usage"
            />
          </div>
        </div>

    </div>
  )
}
