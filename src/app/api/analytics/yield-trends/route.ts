import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { generateYieldNarrative } from "@/server/ai/trend-analyzer"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const withAI = searchParams.get("ai") === "true"
    const orgId = session.user.orgId

    // Fetch all completed/approved batches with yield data
    const batches = await prisma.batch.findMany({
      where: {
        orgId,
        status: { in: ["completed", "under_review", "approved"] },
        yieldPercentage: { not: null },
      },
      select: {
        id: true,
        batchNumber: true,
        yieldPercentage: true,
        manufacturingDate: true,
        status: true,
        mbr: {
          select: {
            product: { select: { productName: true, id: true } },
            yieldLimitMin: true,
            yieldLimitMax: true,
          },
        },
      },
      orderBy: { manufacturingDate: "asc" },
    })

    if (!batches.length) {
      return successResponse({
        batches: [],
        summary: { avgYield: 0, minYield: 0, maxYield: 0, belowLimitCount: 0, totalBatches: 0 },
        productBreakdown: [],
        monthlyTrend: [],
        aiNarrative: null,
      })
    }

    const yields = batches.map((b) => Number(b.yieldPercentage))
    const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length
    const minYield = Math.min(...yields)
    const maxYield = Math.max(...yields)

    const belowLimitCount = batches.filter((b) => {
      const limit = Number(b.mbr?.yieldLimitMin ?? 95)
      return Number(b.yieldPercentage) < limit
    }).length

    // Product breakdown
    const productMap: Record<string, { productName: string; yields: number[]; batchCount: number }> = {}
    for (const b of batches) {
      const name = b.mbr?.product?.productName ?? "Unknown"
      if (!productMap[name]) productMap[name] = { productName: name, yields: [], batchCount: 0 }
      productMap[name].yields.push(Number(b.yieldPercentage))
      productMap[name].batchCount++
    }
    const productBreakdown = Object.values(productMap).map((p) => ({
      productName: p.productName,
      avgYield: p.yields.reduce((a, b) => a + b, 0) / p.yields.length,
      batchCount: p.batchCount,
    }))

    // Monthly trend
    const monthlyMap: Record<string, number[]> = {}
    for (const b of batches) {
      const month = new Date(b.manufacturingDate).toISOString().slice(0, 7)
      if (!monthlyMap[month]) monthlyMap[month] = []
      monthlyMap[month].push(Number(b.yieldPercentage))
    }
    const monthlyTrend = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, yieldArr]) => ({
        month,
        avgYield: yieldArr.reduce((a, b) => a + b, 0) / yieldArr.length,
        batchCount: yieldArr.length,
      }))

    // Determine trend direction
    let trendDirection: "improving" | "declining" | "stable" = "stable"
    if (monthlyTrend.length >= 3) {
      const recent = monthlyTrend.slice(-3).map((m) => m.avgYield)
      const firstHalf = recent.slice(0, Math.ceil(recent.length / 2))
      const secondHalf = recent.slice(Math.floor(recent.length / 2))
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
      if (secondAvg - firstAvg > 0.5) trendDirection = "improving"
      else if (firstAvg - secondAvg > 0.5) trendDirection = "declining"
    }

    const summary = { avgYield, minYield, maxYield, belowLimitCount, totalBatches: batches.length, trendDirection }

    let aiNarrative = null
    if (withAI) {
      aiNarrative = await generateYieldNarrative({
        ...summary,
        productBreakdown,
      })

      await prisma.aIInteraction.create({
        data: {
          orgId,
          userId: session.user.id,
          interactionType: "trend_analysis",
          prompt: "Yield performance analysis",
          response: aiNarrative,
          modelUsed: "anthropic/claude-sonnet-4-5",
        },
      })
    }

    return successResponse({
      batches: batches.map((b) => ({
        batchNumber: b.batchNumber,
        yieldPercentage: Number(b.yieldPercentage),
        manufacturingDate: b.manufacturingDate,
        productName: b.mbr?.product?.productName ?? "Unknown",
        status: b.status,
        yieldLimitMin: Number(b.mbr?.yieldLimitMin ?? 95),
      })),
      summary,
      productBreakdown,
      monthlyTrend,
      aiNarrative,
    })
  } catch (error) {
    console.error("[GET /api/analytics/yield-trends]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch yield trends",
      500
    )
  }
}
