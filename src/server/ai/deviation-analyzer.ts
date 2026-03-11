/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-powered deviation investigation assistant
// Suggests root causes, investigation questions, and CAPA templates based on batch context

import { callOpenRouter, MODELS } from "./openrouter-client"

export interface DeviationAISuggestion {
  rootCauses: Array<{ cause: string; likelihood: "high" | "medium" | "low"; rationale: string }>
  investigationQuestions: string[]
  capaTemplates: Array<{ corrective: string; preventive: string }>
  similarPatterns: string
  riskNote: string
}

export async function suggestDeviationRCA(deviationData: any): Promise<DeviationAISuggestion> {
  const dev = deviationData
  const batch = dev.batch ?? {}
  const product = batch.mbr?.product ?? {}
  const batchStep = dev.batchStep ?? null
  const historicalDeviations: any[] = dev.historicalDeviations ?? []

  const histText =
    historicalDeviations.length > 0
      ? historicalDeviations
          .map(
            (h: any) =>
              `  - [${h.severity}] ${h.deviationNumber}: ${h.description}` +
              (h.rootCause ? ` | Root Cause: ${h.rootCause}` : "") +
              (h.correctiveAction ? ` | CAPA: ${h.correctiveAction}` : "")
          )
          .join("\n")
      : "  None on record for this product/step combination."

  const prompt = `You are a senior pharmaceutical QA specialist helping investigate a GMP deviation. Based on the information provided, give a structured root cause analysis.

DEVIATION DETAILS:
- Deviation Number: ${dev.deviationNumber ?? "N/A"}
- Type: ${dev.deviationType ?? "N/A"} | Category: ${dev.category ?? "N/A"} | Severity: ${dev.severity ?? "N/A"}
- Description: ${dev.description ?? "N/A"}
- Batch: ${batch.batchNumber ?? "N/A"} | Product: ${product.productName ?? "N/A"} ${product.strength ?? ""} ${product.dosageForm ?? ""}
- Step: ${batchStep ? `Step ${batchStep.stepNumber} — ${batchStep.stepName ?? ""}` : "Not step-specific"}
- Status: ${dev.status ?? "open"}

HISTORICAL DEVIATIONS (same product/step):
${histText}

Respond in valid JSON with this exact structure:
{
  "rootCauses": [
    { "cause": "string", "likelihood": "high|medium|low", "rationale": "string" }
  ],
  "investigationQuestions": ["string"],
  "capaTemplates": [
    { "corrective": "string", "preventive": "string" }
  ],
  "similarPatterns": "string (observations about patterns in historical deviations, or 'No patterns detected')",
  "riskNote": "string (one-line note on patient safety / product quality risk level)"
}`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.FAST, maxTokens: 1500, responseFormat: "json" }
  )

  try {
    return JSON.parse(result.content) as DeviationAISuggestion
  } catch {
    throw new Error("AI returned malformed JSON for deviation analysis")
  }
}
