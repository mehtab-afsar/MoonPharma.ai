/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-powered deviation investigation report generator
// Generates a formal GMP-compliant investigation report from deviation data

import { callOpenRouter, MODELS } from "./openrouter-client"

export async function generateDeviationReport(deviationData: any): Promise<string> {
  const dev = deviationData
  const batch = dev.batch ?? {}
  const product = batch.mbr?.product ?? {}
  const batchStep = dev.batchStep ?? null
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const prompt = `You are a pharmaceutical QA specialist writing a formal GMP deviation investigation report.
Generate a professional, regulatory-compliant investigation report based on the following data.

DEVIATION DATA:
- Deviation Number: ${dev.deviationNumber ?? "N/A"}
- Date Raised: ${dev.raisedAt ? new Date(dev.raisedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "N/A"}
- Report Date: ${today}
- Type: ${dev.deviationType ?? "N/A"} | Category: ${dev.category ?? "N/A"} | Severity: ${dev.severity ?? "N/A"}
- Batch Number: ${batch.batchNumber ?? "N/A"}
- Product: ${product.productName ?? "N/A"} ${product.strength ?? ""} ${product.dosageForm ?? ""}
- Step: ${batchStep ? `Step ${batchStep.stepNumber} — ${batchStep.stepName ?? ""}` : "Not step-specific"}
- Raised By: ${dev.raisedBy?.fullName ?? "N/A"} (${dev.raisedBy?.employeeId ?? "N/A"})

DESCRIPTION:
${dev.description ?? "Not provided"}

ROOT CAUSE:
${dev.rootCause ?? "Under investigation"}

IMPACT ASSESSMENT:
${dev.impactAssessment ?? "Not yet completed"}

CORRECTIVE ACTION (CAPA):
${dev.correctiveAction ?? "Not yet determined"}

PREVENTIVE ACTION:
${dev.preventiveAction ?? "Not yet determined"}

STATUS: ${dev.status ?? "Open"}

Write a formal deviation investigation report with these sections:
1. DEVIATION SUMMARY
2. BACKGROUND & CONTEXT
3. DESCRIPTION OF DEVIATION
4. INVESTIGATION FINDINGS & ROOT CAUSE ANALYSIS
5. IMPACT ASSESSMENT
6. CORRECTIVE AND PREVENTIVE ACTIONS (CAPA)
7. CONCLUSION & RECOMMENDATION
8. REFERENCES (cite applicable GMP guidelines: FDA 21 CFR 211.192, ICH Q10, Schedule M as appropriate)

Use formal regulatory language. If root cause or CAPA is not yet determined, state "Under Investigation" for that section.
Format the report in clean markdown.`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.SMART, maxTokens: 2000 }
  )

  return result.content
}
