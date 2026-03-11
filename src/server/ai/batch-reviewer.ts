/* eslint-disable @typescript-eslint/no-explicit-any */
import { callOpenRouter, MODELS } from "./openrouter-client"

export interface FlaggedItem {
  area: "material" | "parameter" | "ipc" | "deviation" | "yield" | "step"
  label: string
  detail: string
  severity: "critical" | "major" | "minor"
}

export interface BatchReviewResult {
  summary: string
  riskLevel: "high" | "medium" | "low"
  approvalRecommendation: "approve" | "return" | "reject"
  flaggedItems: FlaggedItem[]
}

export async function generateBatchReviewSummary(batchData: any): Promise<BatchReviewResult> {
  const batch = batchData
  const product = batch?.mbr?.product
  const materials = batch?.materials ?? []
  const steps = batch?.steps ?? []
  const deviations = batch?.deviations ?? []

  // Build materials section
  const materialsText = materials
    .map((mat: any) => {
      const required = Number(mat.requiredQuantity ?? mat.mbrMaterial?.quantity ?? 0)
      const actual = mat.actualQuantity != null ? Number(mat.actualQuantity) : null
      const materialName = mat.material?.materialName ?? mat.material?.name ?? "Unknown"
      const unit = mat.material?.unit ?? ""
      const toleranceStatus =
        actual == null
          ? "NOT DISPENSED"
          : mat.isWithinTolerance === true
          ? "WITHIN TOLERANCE"
          : mat.isWithinTolerance === false
          ? "OUT OF TOLERANCE"
          : "N/A"

      return `  - ${materialName}: Required ${required} ${unit}, Actual ${actual != null ? `${actual} ${unit}` : "N/A"} [${toleranceStatus}]`
    })
    .join("\n")

  // Build steps section
  const stepsText = steps
    .map((step: any) => {
      const stepName = step.mbrStep?.stepName ?? step.stepName ?? `Step ${step.stepNumber}`
      const statusLine = `Status: ${step.status}`

      const parametersText =
        step.parameters && step.parameters.length > 0
          ? step.parameters
              .map((p: any) => {
                const paramName = p.mbrParameter?.parameterName ?? p.parameterName ?? "Parameter"
                const actual = p.actualValue ?? "N/A"
                const withinLimit =
                  p.isWithinLimit === true
                    ? "PASS"
                    : p.isWithinLimit === false
                    ? "FAIL"
                    : "N/A"
                return `      * ${paramName}: ${actual} [${withinLimit}]`
              })
              .join("\n")
          : "      * No parameters recorded"

      const ipcText =
        step.ipcResults && step.ipcResults.length > 0
          ? step.ipcResults
              .map((r: any) => {
                const checkName = r.mbrIpc?.checkName ?? r.checkName ?? "IPC Check"
                const result = r.resultValue ?? "N/A"
                const withinSpec =
                  r.isWithinSpec === true
                    ? "PASS"
                    : r.isWithinSpec === false
                    ? "FAIL"
                    : "N/A"
                return `      * ${checkName}: ${result} [${withinSpec}]`
              })
              .join("\n")
          : ""

      return [
        `  Step ${step.stepNumber}: ${stepName} (${statusLine})`,
        `    Parameters:`,
        parametersText,
        ipcText ? `    IPC Checks:\n${ipcText}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n\n")

  // Build deviations section
  const deviationsText =
    deviations.length > 0
      ? deviations
          .map((d: any) => {
            return `  - [${(d.severity ?? "").toUpperCase()}] ${d.deviationNumber ?? ""}: ${d.description ?? ""} (Status: ${d.status ?? ""})`
          })
          .join("\n")
      : "  None"

  const yieldPercentage =
    batch.yieldPercentage != null
      ? `${Number(batch.yieldPercentage).toFixed(2)}%`
      : batch.actualYieldValue && batch.theoreticalYield
      ? `${((batch.actualYieldValue / batch.theoreticalYield) * 100).toFixed(2)}%`
      : "Not calculated"

  const manufacturingDate = batch.manufacturingDate
    ? new Date(batch.manufacturingDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A"

  const prompt = `You are a pharmaceutical QA reviewer performing a batch record review. Analyze the following batch manufacturing record.

Batch: ${batch.batchNumber ?? "N/A"}
Product: ${product?.productName ?? "N/A"} ${product?.strength ?? ""} ${product?.dosageForm ?? ""}
Manufacturing Date: ${manufacturingDate}
Yield: ${yieldPercentage}

MATERIALS:
${materialsText || "  No materials recorded"}

MANUFACTURING STEPS:
${stepsText || "  No steps recorded"}

DEVIATIONS: ${deviations.length} deviation${deviations.length !== 1 ? "s" : ""} recorded
${deviationsText}

Respond in valid JSON with this exact structure:
{
  "summary": "Full narrative QA review summary covering: 1. OVERALL ASSESSMENT, 2. KEY FINDINGS, 3. PARAMETER REVIEW, 4. DEVIATION SUMMARY, 5. YIELD ANALYSIS, 6. RECOMMENDATIONS",
  "riskLevel": "high|medium|low",
  "approvalRecommendation": "approve|return|reject",
  "flaggedItems": [
    {
      "area": "material|parameter|ipc|deviation|yield|step",
      "label": "short label (e.g. 'Paracetamol dispensing')",
      "detail": "specific concern with numbers if available",
      "severity": "critical|major|minor"
    }
  ]
}

flaggedItems should only include items that need reviewer attention (OOS, out-of-tolerance, unresolved deviations, low yield). Empty array if everything is acceptable.`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.SMART, maxTokens: 2500, responseFormat: "json" }
  )

  try {
    const parsed = JSON.parse(result.content) as BatchReviewResult
    return parsed
  } catch {
    // Fallback: wrap raw text as summary with no flags
    return {
      summary: result.content,
      riskLevel: "medium",
      approvalRecommendation: "return",
      flaggedItems: [],
    }
  }
}
