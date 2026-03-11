/* eslint-disable @typescript-eslint/no-explicit-any */
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function generateBatchReviewSummary(batchData: any): Promise<string> {
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

  const prompt = `You are a pharmaceutical QA reviewer performing a batch record review. Analyze the following batch manufacturing record and provide a structured review summary.

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

Please provide:
1. OVERALL ASSESSMENT: Pass/Fail recommendation with brief reasoning
2. KEY FINDINGS: List notable observations (good and concerning)
3. PARAMETER REVIEW: Any parameters outside specification
4. DEVIATION SUMMARY: Impact assessment of any deviations
5. YIELD ANALYSIS: Comment on yield percentage vs limits
6. RECOMMENDATIONS: Any actions required before batch release`

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  const content = message.content[0]
  if (content.type === "text") {
    return content.text
  }

  throw new Error("Unexpected response format from AI model")
}
