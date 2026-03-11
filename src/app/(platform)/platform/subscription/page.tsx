import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/server/db/prisma"
import { CreditCard, Users, Package, Activity } from "lucide-react"

const PLANS = {
  starter:      { name: "Starter",      maxUsers: 5,   maxBatchesPerMonth: 50,   maxProducts: 10,   price: "Free" },
  professional: { name: "Professional", maxUsers: 25,  maxBatchesPerMonth: 500,  maxProducts: 100,  price: "$299/mo" },
  enterprise:   { name: "Enterprise",   maxUsers: 999, maxBatchesPerMonth: 9999, maxProducts: 9999, price: "Custom" },
}

function UsageMeter({
  label,
  current,
  max,
  icon: Icon,
}: {
  label: string
  current: number
  max: number
  icon: React.ComponentType<{ className?: string }>
}) {
  const pct = Math.min((current / max) * 100, 100)
  const isWarning = pct >= 80
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-gray-600">
          <Icon className="w-4 h-4" />
          {label}
        </span>
        <span className={isWarning ? "text-amber-600 font-medium" : "text-gray-900 font-medium"}>
          {current} / {max === 9999 ? "∞" : max}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isWarning ? "bg-amber-400" : "bg-black"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default async function PlatformSubscriptionPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const orgId = session.user.orgId

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [org, userCount, batchesThisMonth, productCount] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, subscriptionPlan: true },
    }),
    prisma.user.count({ where: { orgId, isActive: true } }),
    prisma.batch.count({ where: { orgId, createdAt: { gte: startOfMonth } } }),
    prisma.product.count({ where: { orgId } }),
  ])

  const planKey = (org?.subscriptionPlan?.toLowerCase() ?? "starter") as keyof typeof PLANS
  const plan = PLANS[planKey] ?? PLANS.starter

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Subscription</h1>
          <p className="text-sm text-gray-500">Plan details and current usage</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Current Plan</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-0.5">{plan.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{org?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{plan.price}</p>
            {plan.price !== "Free" && <p className="text-xs text-gray-400">billed monthly</p>}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">{plan.maxUsers === 999 ? "Unlimited" : plan.maxUsers}</p>
            <p className="text-xs text-gray-400 mt-0.5">Max users</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{plan.maxBatchesPerMonth === 9999 ? "Unlimited" : plan.maxBatchesPerMonth}</p>
            <p className="text-xs text-gray-400 mt-0.5">Batches/month</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{plan.maxProducts === 9999 ? "Unlimited" : plan.maxProducts}</p>
            <p className="text-xs text-gray-400 mt-0.5">Products</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <h3 className="text-sm font-semibold text-gray-900">Current Usage</h3>
        <UsageMeter label="Team members" current={userCount} max={plan.maxUsers} icon={Users} />
        <UsageMeter label="Batches this month" current={batchesThisMonth} max={plan.maxBatchesPerMonth} icon={Activity} />
        <UsageMeter label="Products" current={productCount} max={plan.maxProducts} icon={Package} />
      </div>

      {planKey !== "enterprise" && (
        <div className="bg-black rounded-xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Need more capacity?</h3>
            <p className="text-sm text-white/60 mt-0.5">Upgrade to Professional or Enterprise for higher limits.</p>
          </div>
          <button
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-not-allowed opacity-70"
            disabled
          >
            Upgrade Plan
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Billing managed by MoonPharma. Contact <span className="underline">support@moonpharma.com</span> for plan changes.
      </p>
    </div>
  )
}
