/* eslint-disable @typescript-eslint/no-explicit-any */
// Batch risk scoring — calculates risk score (0-100) when a batch is completed
// Score drives triage order in the QA review queue
// Based on: OOS count, deviation count/severity, yield %, parameter variance, step anomalies

import { prisma } from "@/server/db/prisma"

export interface BatchRiskResult {
  riskScore: number
  riskCategory: "HIGH" | "MEDIUM" | "LOW"
  factors: string[]
}

export async function calculateBatchRiskScore(batchId: string, orgId: string): Promise<BatchRiskResult> {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, orgId },
    include: {
      deviations: { select: { severity: true, status: true } },
      steps: {
        include: {
          parameters: { select: { isWithinLimit: true } },
          ipcResults: { select: { isWithinSpec: true } },
        },
      },
      mbr: {
        select: {
          yieldLowerLimit: true,
          yieldUpperLimit: true,
        },
      },
    },
  })

  if (!batch) return { riskScore: 0, riskCategory: "LOW", factors: [] }

  let score = 0
  const factors: string[] = []

  // 1. Deviations (heavy weight)
  const criticalDevs = batch.deviations.filter((d: any) => d.severity === "critical").length
  const majorDevs = batch.deviations.filter((d: any) => d.severity === "major").length
  const openDevs = batch.deviations.filter((d: any) => ["open", "under_investigation"].includes(d.status)).length

  if (criticalDevs > 0) {
    score += criticalDevs * 25
    factors.push(`${criticalDevs} critical deviation${criticalDevs > 1 ? "s" : ""}`)
  }
  if (majorDevs > 0) {
    score += majorDevs * 15
    factors.push(`${majorDevs} major deviation${majorDevs > 1 ? "s" : ""}`)
  }
  if (openDevs > 0) {
    score += openDevs * 10
    factors.push(`${openDevs} unresolved deviation${openDevs > 1 ? "s" : ""}`)
  }

  // 2. OOS parameters
  let oosParams = 0
  for (const step of batch.steps as any[]) {
    for (const p of step.parameters) {
      if (p.isWithinLimit === false) oosParams++
    }
    for (const r of step.ipcResults) {
      if (r.isWithinSpec === false) oosParams++
    }
  }

  if (oosParams >= 5) { score += 20; factors.push(`${oosParams} OOS results`) }
  else if (oosParams >= 2) { score += 12; factors.push(`${oosParams} OOS results`) }
  else if (oosParams >= 1) { score += 6; factors.push(`${oosParams} OOS result`) }

  // 3. Yield below limit
  if (batch.yieldPercentage != null) {
    const yieldPct = Number(batch.yieldPercentage)
    const lowerLimit = batch.mbr?.yieldLowerLimit != null ? Number(batch.mbr.yieldLowerLimit) : 95
    if (yieldPct < lowerLimit) {
      const deficit = lowerLimit - yieldPct
      score += Math.min(30, deficit * 5)
      factors.push(`Yield ${yieldPct.toFixed(1)}% below limit (${lowerLimit}%)`)
    } else if (yieldPct < lowerLimit + 2) {
      score += 5
      factors.push(`Yield approaching lower limit (${yieldPct.toFixed(1)}%)`)
    }
  }

  // Cap at 100
  score = Math.min(100, score)

  const riskCategory: "HIGH" | "MEDIUM" | "LOW" =
    score >= 50 ? "HIGH" : score >= 20 ? "MEDIUM" : "LOW"

  return { riskScore: score, riskCategory, factors }
}

export async function saveBatchRiskScore(batchId: string, result: BatchRiskResult): Promise<void> {
  await prisma.batch.update({
    where: { id: batchId },
    data: {
      riskScore: result.riskScore,
      riskCategory: result.riskCategory,
    },
  })
}
