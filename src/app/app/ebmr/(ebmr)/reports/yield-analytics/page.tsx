"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { ArrowLeft, Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

// ============================================
// TYPES
// ============================================

interface YieldData {
  batches: Array<{
    batchNumber: string
    yieldPercentage: number
    manufacturingDate: string
    productName: string
    status: string
    yieldLowerLimit: number
  }>
  summary: {
    avgYield: number
    minYield: number
    maxYield: number
    belowLimitCount: number
    totalBatches: number
    trendDirection: "improving" | "declining" | "stable"
  }
  productBreakdown: Array<{ productName: string; avgYield: number; batchCount: number }>
  monthlyTrend: Array<{ month: string; avgYield: number; batchCount: number }>
  aiNarrative: string | null
}

// ============================================
// PAGE
// ============================================

export default function YieldAnalyticsPage() {
  const [data, setData] = useState<YieldData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  const loadData = async (withAI = false) => {
    if (withAI) setAiLoading(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/analytics/yield-trends?ai=${withAI}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
      setAiLoading(false)
    }
  }

  useEffect(() => {
    loadData(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) return null

  const TrendIcon =
    data.summary.trendDirection === "improving"
      ? TrendingUp
      : data.summary.trendDirection === "declining"
      ? TrendingDown
      : Minus

  const trendColor =
    data.summary.trendDirection === "improving"
      ? "text-gray-700"
      : data.summary.trendDirection === "declining"
      ? "text-gray-500"
      : "text-gray-400"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-gray-500 mb-3">
          <Link href={ROUTES.REPORTS}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reports
          </Link>
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              Yield Performance Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Batch yield trends, product comparison, and AI-detected patterns
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => loadData(true)}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {data.aiNarrative ? "Refresh AI Analysis" : "Generate AI Analysis"}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Average Yield</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {data.summary.totalBatches > 0 ? `${data.summary.avgYield.toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Trend</p>
            <div className={`flex items-center gap-1.5 mt-1 ${trendColor}`}>
              <TrendIcon className="h-5 w-5" />
              <p className="text-base font-semibold capitalize">{data.summary.trendDirection}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Below Limit</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.summary.belowLimitCount}</p>
            <p className="text-xs text-gray-400 mt-1">of {data.summary.totalBatches} batches</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Range</p>
            <p className="text-base font-semibold text-gray-900 mt-1">
              {data.summary.totalBatches > 0
                ? `${data.summary.minYield.toFixed(1)}% – ${data.summary.maxYield.toFixed(1)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {data.aiNarrative && (
        <Card className="border border-gray-300 shadow-sm bg-gray-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-700" />
              <CardTitle className="text-sm font-semibold text-gray-900">AI Yield Analysis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.aiNarrative}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Monthly Average Yield</CardTitle>
            <CardDescription className="text-xs text-gray-500">Dashed line = typical lower limit (95%)</CardDescription>
          </CardHeader>
          <CardContent>
            {data.monthlyTrend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No yield trend data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <ReferenceLine y={95} stroke="#ccc" strokeDasharray="4 4" label={{ value: "95%", position: "right", fontSize: 10 }} />
                  <Line type="monotone" dataKey="avgYield" stroke="#111" strokeWidth={2} dot={{ r: 3 }} name="Avg Yield" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Batch scatter (all batches) */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Individual Batch Yields</CardTitle>
            <CardDescription className="text-xs text-gray-500">All batches chronologically</CardDescription>
          </CardHeader>
          <CardContent>
            {data.batches.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No batch yield data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.batches}>
                  <XAxis dataKey="batchNumber" tick={{ fontSize: 9 }} />
                  <YAxis domain={[85, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <ReferenceLine y={95} stroke="#ccc" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="yieldPercentage" stroke="#111" strokeWidth={1.5} dot={{ r: 2 }} name="Yield %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Breakdown */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">Yield by Product</CardTitle>
        </CardHeader>
        <CardContent>
          {data.productBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No product data</p>
          ) : (
            <div className="space-y-3">
              {data.productBreakdown.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-44 truncate text-sm text-gray-700">{p.productName}</div>
                  <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${p.avgYield}%`,
                        backgroundColor: p.avgYield >= 97 ? "#111" : p.avgYield >= 95 ? "#555" : "#aaa",
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-mono text-gray-700">
                    {p.avgYield.toFixed(1)}%
                  </div>
                  <div className="w-16 text-right text-xs text-gray-400">
                    {p.batchCount} batch{p.batchCount !== 1 ? "es" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
