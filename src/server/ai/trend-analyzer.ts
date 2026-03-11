// AI-powered trend analysis for OOS events, yield performance, and equipment risk

import { callOpenRouter, MODELS } from "./openrouter-client"

export interface OOSTrendNarrative {
  headline: string
  topRisks: Array<{ area: string; finding: string; recommendation: string }>
  positiveObservations: string[]
  regulatoryNote: string
}

export interface EquipmentRiskItem {
  equipmentCode: string
  equipmentName: string
  oosCount: number
  deviationCount: number
  daysSinceCalibration: number | null
  riskScore: "high" | "medium" | "low"
  riskReason: string
}

export async function generateOOSTrendNarrative(data: {
  totalOOS: number
  totalBatches: number
  oosRate: number
  topSteps: Array<{ stepName: string; oosCount: number; totalCount: number }>
  topProducts: Array<{ productName: string; oosCount: number }>
  topEquipment: Array<{ equipmentCode: string; equipmentName: string; oosCount: number }>
  monthlyTrend: Array<{ month: string; oosCount: number; batchCount: number }>
}): Promise<OOSTrendNarrative> {
  const prompt = `You are a pharmaceutical quality analyst reviewing OOS (out-of-specification) trend data. Provide a concise narrative analysis.

DATA SUMMARY:
- Total batches analyzed: ${data.totalBatches}
- Total OOS events: ${data.totalOOS} (${(data.oosRate * 100).toFixed(1)}% rate)

TOP OOS STEPS:
${data.topSteps.map((s) => `  - ${s.stepName}: ${s.oosCount} OOS out of ${s.totalCount} readings (${((s.oosCount / Math.max(s.totalCount, 1)) * 100).toFixed(1)}%)`).join("\n") || "  No data"}

TOP OOS PRODUCTS:
${data.topProducts.map((p) => `  - ${p.productName}: ${p.oosCount} OOS events`).join("\n") || "  No data"}

TOP OOS EQUIPMENT:
${data.topEquipment.map((e) => `  - ${e.equipmentCode} (${e.equipmentName}): ${e.oosCount} associated OOS events`).join("\n") || "  No data"}

MONTHLY TREND (recent 6 months):
${data.monthlyTrend.map((m) => `  - ${m.month}: ${m.oosCount} OOS in ${m.batchCount} batches`).join("\n") || "  No data"}

Respond in valid JSON:
{
  "headline": "One sentence executive summary of OOS situation",
  "topRisks": [
    { "area": "string", "finding": "string", "recommendation": "string" }
  ],
  "positiveObservations": ["string"],
  "regulatoryNote": "one sentence referencing applicable FDA/ICH guidance"
}`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.FAST, maxTokens: 800, responseFormat: "json" }
  )

  try {
    return JSON.parse(result.content) as OOSTrendNarrative
  } catch {
    return {
      headline: "OOS trend analysis complete. Review data charts for details.",
      topRisks: [],
      positiveObservations: [],
      regulatoryNote: "Refer to FDA 21 CFR 211.192 for OOS investigation requirements.",
    }
  }
}

export async function generateYieldNarrative(data: {
  avgYield: number
  minYield: number
  maxYield: number
  belowLimitCount: number
  totalBatches: number
  trendDirection: "improving" | "declining" | "stable"
  productBreakdown: Array<{ productName: string; avgYield: number; batchCount: number }>
}): Promise<string> {
  const prompt = `Pharmaceutical yield analyst: Write a 2-3 sentence narrative about this yield data.

Average yield: ${data.avgYield.toFixed(2)}%
Range: ${data.minYield.toFixed(2)}% - ${data.maxYield.toFixed(2)}%
Batches below yield limit: ${data.belowLimitCount} of ${data.totalBatches}
Trend: ${data.trendDirection}

Products:
${data.productBreakdown.map((p) => `- ${p.productName}: ${p.avgYield.toFixed(1)}% avg over ${p.batchCount} batches`).join("\n")}

Be concise, mention any concerning patterns, and reference typical pharma yield limits (95-100%).`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.FAST, maxTokens: 300 }
  )

  return result.content
}
