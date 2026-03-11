"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FlaskConical, ClipboardCheck, AlertTriangle, CheckCircle2 } from "lucide-react"

function useCountUp(target: number, duration = 1200, active = false) {
  const [value, setValue] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    if (!active || target === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easeOut cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration, active])

  return value
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  delay,
}: {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  delay: number
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const [active, setActive] = useState(false)
  const displayed = useCountUp(value, 1200, active)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true) },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Link
      ref={ref}
      href={href}
      className="stat-card group block border border-gray-200 bg-white rounded-xl p-5 btn-press"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-4xl font-bold text-gray-900 count-value tabular-nums">
            {displayed}
          </p>
          <p className="mt-1.5 text-xs text-gray-400">{description}</p>
        </div>
        <div className="rounded-xl bg-gray-100 border border-gray-200 p-2.5 group-hover:bg-black group-hover:border-black transition-colors duration-150">
          <Icon className="h-4 w-4 text-gray-600 group-hover:text-white transition-colors duration-150" />
        </div>
      </div>
    </Link>
  )
}

interface DashboardMetricsProps {
  activeBatches: number
  pendingReview: number
  openDeviations: number
  releasedThisMonth: number
}

export function DashboardMetrics({
  activeBatches,
  pendingReview,
  openDeviations,
  releasedThisMonth,
}: DashboardMetricsProps) {
  const cards = [
    {
      title: "Active Batches",
      value: activeBatches,
      description: "Currently in production",
      icon: FlaskConical,
      href: "/batches?status=in_progress",
    },
    {
      title: "Pending QA Review",
      value: pendingReview,
      description: "Awaiting quality review",
      icon: ClipboardCheck,
      href: "/review",
    },
    {
      title: "Open Deviations",
      value: openDeviations,
      description: "Requiring attention",
      icon: AlertTriangle,
      href: "/deviations",
    },
    {
      title: "Released This Month",
      value: releasedThisMonth,
      description: "Batches approved this month",
      icon: CheckCircle2,
      href: "/batches?status=approved",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <StatCard key={card.title} {...card} delay={i * 100} />
      ))}
    </div>
  )
}
