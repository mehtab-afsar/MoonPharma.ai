"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { ArrowLeft, Loader2, Sparkles, AlertTriangle, ShieldAlert, TrendingDown } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

// ============================================
// TYPES
// ============================================

interface OOSData {
  totalBatches: number
  totalOOS: number
  oosRate: number
  topSteps: Array<{ stepName: string; oosCount: number; total: number }>
  topProducts: Array<{ productName: string; oosCount: number }>
  topEquipment: Array<{ equipmentCode: string; equipmentName: string; oosCount: number }>
  monthlyTrend: Array<{ month: string; oosCount: number; batchCount: number }>
  aiNarrative: {
    headline: string
    topRisks: Array<{ area: string; finding: string; recommendation: string }>
    positiveObservations: string[]
    regulatoryNote: string
  } | null
}

// ============================================
// PAGE
// ============================================

export default function OOSTrendsPage() {
  const [data, setData] = useState<OOSData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)

  const loadData = async (withAI = false) => {
    if (withAI) setAiLoading(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/analytics/oos-trends?ai=${withAI}`)
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

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">Failed to load OOS trend data.</p>
      </div>
    )
  }

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
              <TrendingDown className="h-5 w-5 text-gray-600" />
              OOS Trend Analysis
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Out-of-specification parameter and IPC events across all batches
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
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Total OOS Events</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalOOS}</p>
            <p className="text-xs text-gray-400 mt-1">across {data.totalBatches} batches</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">OOS Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {(data.oosRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">events per batch</p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="pt-5 pb-4 px-5">
            <p className="text-xs text-gray-500">Top OOS Step</p>
            <p className="text-base font-semibold text-gray-900 mt-1 truncate">
              {data.topSteps[0]?.stepName ?? "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {data.topSteps[0] ? `${data.topSteps[0].oosCount} events` : "No OOS events"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* AI Narrative */}
      {data.aiNarrative && (
        <Card className="border border-gray-300 shadow-sm bg-gray-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gray-700" />
              <CardTitle className="text-sm font-semibold text-gray-900">AI Analysis</CardTitle>
            </div>
            <p className="text-sm text-gray-700 mt-1">{data.aiNarrative.headline}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.aiNarrative.topRisks.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Top Risks
                </p>
                <div className="space-y-2">
                  {data.aiNarrative.topRisks.map((r, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white text-sm">
                      <p className="font-medium text-gray-800">{r.area}</p>
                      <p className="text-gray-600 mt-0.5">{r.finding}</p>
                      <p className="text-xs text-gray-500 mt-1.5 italic">→ {r.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.aiNarrative.positiveObservations.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">Positive Observations</p>
                  <ul className="space-y-1">
                    {data.aiNarrative.positiveObservations.map((o, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-gray-400">•</span>
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
            <p className="text-xs text-gray-400 italic">{data.aiNarrative.regulatoryNote}</p>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">Monthly OOS Trend</CardTitle>
            <CardDescription className="text-xs text-gray-500">OOS events per month</CardDescription>
          </CardHeader>
          <CardContent>
            {data.monthlyTrend.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No trend data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="oosCount" stroke="#111" strokeWidth={2} dot={{ r: 3 }} name="OOS Events" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* OOS by Step */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">OOS by Step</CardTitle>
            <CardDescription className="text-xs text-gray-500">Top 5 steps with most OOS events</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topSteps.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No OOS events recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.topSteps} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="stepName" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip />
                  <Bar dataKey="oosCount" fill="#111" name="OOS Events" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product & Equipment */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Product */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">OOS by Product</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No OOS events recorded</p>
            ) : (
              <div className="space-y-2">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 text-sm text-gray-700 truncate">{p.productName}</div>
                    <div className="h-4 bg-gray-100 rounded flex-1">
                      <div
                        className="h-4 bg-gray-800 rounded"
                        style={{
                          width: `${(p.oosCount / Math.max(...data.topProducts.map((x) => x.oosCount), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-xs font-mono text-gray-600 text-right">{p.oosCount}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Equipment */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-900">OOS by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topEquipment.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No equipment correlation data</p>
            ) : (
              <div className="space-y-2">
                {data.topEquipment.map((e, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 font-mono truncate">{e.equipmentCode}</p>
                      <p className="text-xs text-gray-400 truncate">{e.equipmentName}</p>
                    </div>
                    <div className="h-4 bg-gray-100 rounded flex-1">
                      <div
                        className="h-4 bg-gray-800 rounded"
                        style={{
                          width: `${(e.oosCount / Math.max(...data.topEquipment.map((x) => x.oosCount), 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-xs font-mono text-gray-600 text-right">{e.oosCount}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
