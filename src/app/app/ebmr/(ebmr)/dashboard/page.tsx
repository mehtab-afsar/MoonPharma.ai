import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/server/db/prisma"
import { BatchStatus, DeviationStatus } from "@/generated/prisma"
import { DashboardMetrics } from "@/features/dashboard/components/DashboardMetrics"
import { QuickActions } from "@/features/dashboard/components/QuickActions"
import { RecentBatchesTable } from "@/features/dashboard/components/RecentBatchesTable"
import { OnboardingChecklist } from "@/features/dashboard/components/OnboardingChecklist"
import { ArrowRight } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

async function getOnboardingStatus(orgId: string) {
  const [productCount, materialCount, equipmentCount, mbrCount, userCount] = await Promise.all([
    prisma.product.count({ where: { orgId } }),
    prisma.material.count({ where: { orgId } }),
    prisma.equipment.count({ where: { orgId } }),
    prisma.masterBatchRecord.count({ where: { orgId } }),
    prisma.user.count({ where: { orgId } }),
  ])
  return {
    hasProduct: productCount > 0,
    hasMaterial: materialCount > 0,
    hasEquipment: equipmentCount > 0,
    hasMBR: mbrCount > 0,
    hasTeam: userCount > 1, // More than just the admin
    isComplete: productCount > 0 && materialCount > 0 && equipmentCount > 0 && mbrCount > 0,
  }
}

async function getDashboardStats(orgId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    activeBatchesCount,
    pendingReviewCount,
    openDeviationsCount,
    releasedThisMonthCount,
    recentBatches,
  ] = await Promise.all([
    prisma.batch.count({ where: { orgId, status: BatchStatus.in_progress } }),
    prisma.batchReview.count({ where: { batch: { orgId }, status: { in: ["pending", "in_progress"] } } }),
    prisma.deviation.count({ where: { orgId, status: { in: [DeviationStatus.open, DeviationStatus.under_investigation] } } }),
    prisma.batch.count({ where: { orgId, status: BatchStatus.approved, updatedAt: { gte: startOfMonth } } }),
    prisma.batch.findMany({
      where: { orgId },
      include: {
        mbr: { include: { product: { select: { productName: true, strength: true, dosageForm: true } } } },
        initiatedBy: { select: { fullName: true } },
        _count: { select: { deviations: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ])

  // Serialize Prisma Decimal fields to plain numbers so they cross the server→client boundary
  const serializedBatches = JSON.parse(JSON.stringify(recentBatches))

  return { activeBatchesCount, pendingReviewCount, openDeviationsCount, releasedThisMonthCount, recentBatches: serializedBatches }
}

const EMPTY_STATS = {
  activeBatchesCount: 0,
  pendingReviewCount: 0,
  openDeviationsCount: 0,
  releasedThisMonthCount: 0,
  recentBatches: [] as Awaited<ReturnType<typeof getDashboardStats>>["recentBatches"],
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userName = session?.user?.fullName?.split(" ")[0] ?? "User"
  const orgId = session?.user?.orgId ?? ""

  const [stats, onboarding] = await Promise.all([
    orgId ? getDashboardStats(orgId).catch(() => EMPTY_STATS) : Promise.resolve(EMPTY_STATS),
    orgId ? getOnboardingStatus(orgId).catch(() => null) : Promise.resolve(null),
  ])

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Good morning, {userName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s what&apos;s happening across your manufacturing floor.
        </p>
      </div>

      {/* Onboarding checklist (only shown if setup is incomplete) */}
      {onboarding && !onboarding.isComplete && (
        <OnboardingChecklist
          hasProduct={onboarding.hasProduct}
          hasMaterial={onboarding.hasMaterial}
          hasEquipment={onboarding.hasEquipment}
          hasMBR={onboarding.hasMBR}
          hasTeam={onboarding.hasTeam}
        />
      )}

      {/* Count-up stat cards */}
      <DashboardMetrics
        activeBatches={stats.activeBatchesCount}
        pendingReview={stats.pendingReviewCount}
        openDeviations={stats.openDeviationsCount}
        releasedThisMonth={stats.releasedThisMonthCount}
      />

      {/* Quick Actions — snap scroll */}
      <QuickActions pendingReviewCount={stats.pendingReviewCount} />

      {/* Recent Batches */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent Batches</h2>
            <p className="text-sm text-gray-500">Latest batch records across all products</p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-gray-300">
            <Link href={ROUTES.BATCHES}>
              View All
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <RecentBatchesTable batches={stats.recentBatches} />
      </div>
    </div>
  )
}
