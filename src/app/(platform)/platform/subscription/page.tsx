import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/server/db/prisma"
import { CreditCard, Users, Package, Activity, Check } from "lucide-react"

const PLANS = {
  starter: {
    name: "Starter",
    price: "Free",
    description: "For small teams getting started with eBMR.",
    maxUsers: 5,
    maxBatchesPerMonth: 50,
    maxProducts: 10,
    features: [
      "Up to 5 team members",
      "50 batches per month",
      "10 product SKUs",
      "Basic deviation tracking",
      "Email support",
    ],
  },
  professional: {
    name: "Professional",
    price: "$299",
    description: "For growing manufacturing teams.",
    maxUsers: 25,
    maxBatchesPerMonth: 500,
    maxProducts: 100,
    features: [
      "Up to 25 team members",
      "500 batches per month",
      "100 product SKUs",
      "Advanced OOS & deviation rules",
      "Audit trail & reporting",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    description: "Unlimited scale with dedicated support.",
    maxUsers: 9999,
    maxBatchesPerMonth: 9999,
    maxProducts: 9999,
    features: [
      "Unlimited team members",
      "Unlimited batches",
      "Unlimited products",
      "Custom workflow configuration",
      "Dedicated account manager",
      "SLA & compliance support",
    ],
  },
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
  const unlimited = max >= 9999
  const pct = unlimited ? 0 : Math.min((current / max) * 100, 100)
  const isWarning = !unlimited && pct >= 80
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">{label}</span>
          <span className={`text-sm font-medium ${isWarning ? "text-amber-600" : "text-gray-900"}`}>
            {current}{unlimited ? "" : ` / ${max}`}
            {unlimited && <span className="text-xs text-gray-400 font-normal ml-1">unlimited</span>}
          </span>
        </div>
        {!unlimited && (
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isWarning ? "bg-amber-400" : "bg-black"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
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
  const currentPlan = PLANS[planKey] ?? PLANS.starter

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
          <CreditCard className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Subscription</h1>
          <p className="text-sm text-gray-500">{org?.name} · Plan details and usage</p>
        </div>
      </div>

      {/* Current Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Current Usage</h2>
          <span className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full">
            {currentPlan.name} Plan
          </span>
        </div>
        <div className="space-y-4">
          <UsageMeter label="Team members" current={userCount} max={currentPlan.maxUsers} icon={Users} />
          <UsageMeter label="Batches this month" current={batchesThisMonth} max={currentPlan.maxBatchesPerMonth} icon={Activity} />
          <UsageMeter label="Products" current={productCount} max={currentPlan.maxProducts} icon={Package} />
        </div>
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-3 gap-4">
          {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
            const isCurrent = key === planKey
            return (
              <div
                key={key}
                className={`relative rounded-xl border p-5 flex flex-col gap-4 ${
                  isCurrent ? "border-black bg-gray-950 text-white" : "border-gray-200 bg-white"
                }`}
              >
                {isCurrent && (
                  <span className="absolute top-4 right-4 text-xs bg-white text-black px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isCurrent ? "text-gray-400" : "text-gray-400"}`}>
                    {plan.name}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${isCurrent ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    {plan.price !== "Free" && plan.price !== "Custom" && (
                      <span className={`text-sm ${isCurrent ? "text-gray-400" : "text-gray-400"}`}>/mo</span>
                    )}
                  </div>
                  <p className={`text-xs mt-1 ${isCurrent ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isCurrent ? "text-gray-400" : "text-gray-400"}`} />
                      <span className={isCurrent ? "text-gray-300" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors cursor-not-allowed ${
                    isCurrent
                      ? "bg-white/10 text-white/40"
                      : key === "enterprise"
                      ? "border border-gray-200 text-gray-400"
                      : "bg-black text-white opacity-40"
                  }`}
                >
                  {isCurrent ? "Current Plan" : key === "enterprise" ? "Contact Sales" : "Upgrade"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        To change your plan, contact <span className="underline">support@moonpharma.com</span>
      </p>
    </div>
  )
}
