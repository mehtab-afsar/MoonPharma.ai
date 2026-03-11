import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { generateOOSTrendNarrative } from "@/server/ai/trend-analyzer"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const withAI = searchParams.get("ai") === "true"
    const orgId = session.user.orgId

    // Fetch all OOS step parameters for this org
    const oosParams = await prisma.batchStepParameter.findMany({
      where: {
        isWithinLimit: false,
        batchStep: { batch: { orgId } },
      },
      include: {
        batchStep: {
          include: {
            batch: {
              include: {
                mbr: {
                  include: { product: { select: { productName: true } } },
                },
              },
            },
            equipment: { select: { equipmentCode: true, equipmentName: true } },
            mbrStep: { select: { stepName: true } },
          },
        },
        mbrParameter: { select: { parameterName: true } },
      },
    })

    // Fetch all OOS IPC results
    const oosIPC = await prisma.batchIPCResult.findMany({
      where: {
        isWithinSpec: false,
        batchStep: { batch: { orgId } },
      },
      include: {
        batchStep: {
          include: {
            batch: {
              include: {
                mbr: {
                  include: { product: { select: { productName: true } } },
                },
              },
            },
            equipment: { select: { equipmentCode: true, equipmentName: true } },
          },
        },
      },
    })

    // Total batches for rate calculation
    const totalBatches = await prisma.batch.count({
      where: { orgId, status: { in: ["completed", "under_review", "approved"] } },
    })

    const totalOOS = oosParams.length + oosIPC.length

    // Aggregate by step name
    const stepCounts: Record<string, { oosCount: number; totalCount: number }> = {}
    for (const p of oosParams) {
      const name = p.batchStep.mbrStep?.stepName ?? `Step ${p.batchStep.stepNumber}`
      if (!stepCounts[name]) stepCounts[name] = { oosCount: 0, totalCount: 0 }
      stepCounts[name].oosCount++
    }
    // Get total parameter readings per step for rate calc
    const allParams = await prisma.batchStepParameter.groupBy({
      by: ["batchStepId"],
      _count: { id: true },
      where: { batchStep: { batch: { orgId } } },
    })
    for (const a of allParams) {
      const step = await prisma.batchStep.findFirst({
        where: { id: a.batchStepId },
        select: { mbrStep: { select: { stepName: true } }, stepNumber: true },
      })
      if (step) {
        const name = step.mbrStep?.stepName ?? `Step ${step.stepNumber}`
        if (!stepCounts[name]) stepCounts[name] = { oosCount: 0, totalCount: 0 }
        stepCounts[name].totalCount += a._count.id
      }
    }

    const topSteps = Object.entries(stepCounts)
      .sort((a, b) => b[1].oosCount - a[1].oosCount)
      .slice(0, 5)
      .map(([stepName, counts]) => ({ stepName, ...counts }))

    // Aggregate by product
    const productCounts: Record<string, number> = {}
    for (const p of oosParams) {
      const name = p.batchStep.batch.mbr?.product?.productName ?? "Unknown"
      productCounts[name] = (productCounts[name] ?? 0) + 1
    }
    for (const r of oosIPC) {
      const name = r.batchStep.batch.mbr?.product?.productName ?? "Unknown"
      productCounts[name] = (productCounts[name] ?? 0) + 1
    }
    const topProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productName, oosCount]) => ({ productName, oosCount }))

    // Aggregate by equipment
    const equipmentCounts: Record<string, { equipmentCode: string; equipmentName: string; oosCount: number }> = {}
    for (const p of oosParams) {
      const eq = p.batchStep.equipment
      if (eq) {
        const key = eq.equipmentCode
        if (!equipmentCounts[key]) {
          equipmentCounts[key] = { equipmentCode: eq.equipmentCode, equipmentName: eq.equipmentName, oosCount: 0 }
        }
        equipmentCounts[key].oosCount++
      }
    }
    const topEquipment = Object.values(equipmentCounts)
      .sort((a, b) => b.oosCount - a.oosCount)
      .slice(0, 5)

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const recentBatches = await prisma.batch.findMany({
      where: { orgId, createdAt: { gte: sixMonthsAgo } },
      select: {
        id: true,
        createdAt: true,
        steps: {
          select: {
            parameters: { select: { isWithinLimit: true } },
            ipcResults: { select: { isWithinSpec: true } },
          },
        },
      },
    })

    const monthlyMap: Record<string, { oosCount: number; batchCount: number }> = {}
    for (const b of recentBatches) {
      const month = b.createdAt.toISOString().slice(0, 7)
      if (!monthlyMap[month]) monthlyMap[month] = { oosCount: 0, batchCount: 0 }
      monthlyMap[month].batchCount++
      for (const step of b.steps) {
        for (const p of step.parameters) {
          if (p.isWithinLimit === false) monthlyMap[month].oosCount++
        }
        for (const r of step.ipcResults) {
          if (r.isWithinSpec === false) monthlyMap[month].oosCount++
        }
      }
    }

    const monthlyTrend = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({ month, ...data }))

    const analyticsData = {
      totalBatches,
      totalOOS,
      oosRate: totalBatches > 0 ? totalOOS / totalBatches : 0,
      topSteps,
      topProducts,
      topEquipment,
      monthlyTrend,
    }

    // Optionally generate AI narrative
    let aiNarrative = null
    if (withAI) {
      aiNarrative = await generateOOSTrendNarrative(analyticsData)

      await prisma.aIInteraction.create({
        data: {
          orgId,
          userId: session.user.id,
          interactionType: "trend_analysis",
          prompt: "OOS trend analysis",
          response: JSON.stringify(aiNarrative),
          modelUsed: "anthropic/claude-sonnet-4-5",
        },
      })
    }

    return successResponse({ ...analyticsData, aiNarrative })
  } catch (error) {
    console.error("[GET /api/analytics/oos-trends]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch OOS trends",
      500
    )
  }
}
