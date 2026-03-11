/* eslint-disable @typescript-eslint/no-explicit-any */
// Real-time parameter anomaly detection
// Checks if a newly recorded parameter value is statistically unusual vs. historical norms
// Even if within spec (min/max), flags values that deviate from the historical mean

import { callOpenRouter, MODELS } from "./openrouter-client"
import { prisma } from "@/server/db/prisma"

export interface AnomalyResult {
  isAnomaly: boolean
  confidence: "high" | "medium" | "low"
  message: string
  historicalMean: number | null
  historicalStdDev: number | null
  zScore: number | null
}

/**
 * Fetch historical values for a given parameter in a given MBR step
 * and determine if the new value is statistically unusual.
 */
export async function checkParameterAnomaly(params: {
  mbrStepId: string
  parameterName: string
  actualNumericValue: number
  orgId: string
  minValue?: number | null
  maxValue?: number | null
}): Promise<AnomalyResult> {
  const { mbrStepId, parameterName, actualNumericValue, orgId, minValue, maxValue } = params

  // Need at least 5 historical readings to be meaningful
  const historical = await prisma.batchStepParameter.findMany({
    where: {
      actualNumericValue: { not: null },
      mbrParameter: {
        mbrStepId,
        parameterName,
      },
      batchStep: {
        batch: { orgId },
      },
    },
    select: { actualNumericValue: true },
    orderBy: { recordedAt: "desc" },
    take: 50,
  })

  if (historical.length < 5) {
    return {
      isAnomaly: false,
      confidence: "low",
      message: "Insufficient historical data for anomaly detection (need 5+ prior readings).",
      historicalMean: null,
      historicalStdDev: null,
      zScore: null,
    }
  }

  const values = historical.map((h) => Number(h.actualNumericValue))
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  if (stdDev < 0.001) {
    // All historical values are essentially identical — any deviation is notable
    const zScore = stdDev > 0 ? Math.abs(actualNumericValue - mean) / stdDev : 0
    return {
      isAnomaly: actualNumericValue !== mean,
      confidence: "medium",
      message:
        actualNumericValue !== mean
          ? `Value ${actualNumericValue} deviates from historical constant ${mean.toFixed(3)} for "${parameterName}".`
          : "Value matches historical constant.",
      historicalMean: mean,
      historicalStdDev: stdDev,
      zScore,
    }
  }

  const zScore = Math.abs(actualNumericValue - mean) / stdDev

  // If z-score > 2.5, it's statistically unusual (>97.5th percentile from mean)
  if (zScore > 2.5) {
    const prompt = `A pharmaceutical manufacturing parameter reading may be anomalous.
Parameter: "${parameterName}"
Current value: ${actualNumericValue}
Historical mean (last ${values.length} readings): ${mean.toFixed(3)}
Historical std deviation: ${stdDev.toFixed(3)}
Z-score: ${zScore.toFixed(2)}
Specification limits: ${minValue != null ? `Min: ${minValue}` : "No min"}, ${maxValue != null ? `Max: ${maxValue}` : "No max"}

Write ONE concise sentence (under 100 words) explaining the anomaly and what it might indicate. Do NOT mention z-score.`

    let aiMessage = `Value ${actualNumericValue} is ${zScore.toFixed(1)} standard deviations from the historical mean of ${mean.toFixed(2)} for "${parameterName}".`

    try {
      const result = await callOpenRouter(
        [{ role: "user", content: prompt }],
        { model: MODELS.FAST, maxTokens: 150 }
      )
      aiMessage = result.content.trim()
    } catch {
      // Use fallback message if AI fails
    }

    return {
      isAnomaly: true,
      confidence: zScore > 3.5 ? "high" : "medium",
      message: aiMessage,
      historicalMean: mean,
      historicalStdDev: stdDev,
      zScore,
    }
  }

  return {
    isAnomaly: false,
    confidence: "low",
    message: `Value ${actualNumericValue} is within historical norms for "${parameterName}" (mean: ${mean.toFixed(2)} ±${stdDev.toFixed(2)}).`,
    historicalMean: mean,
    historicalStdDev: stdDev,
    zScore,
  }
}
