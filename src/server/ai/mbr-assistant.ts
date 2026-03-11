/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-powered MBR step authoring assistant
// Given a plain-English description, generates a full MBR step with parameters and IPC checks

import { callOpenRouter, MODELS } from "./openrouter-client"

export interface AIGeneratedParameter {
  parameterName: string
  parameterType: "numeric" | "text" | "pass_fail" | "selection"
  unit?: string
  targetValue?: string
  minValue?: number
  maxValue?: number
  isCritical: boolean
  sequenceOrder: number
}

export interface AIGeneratedIPCCheck {
  checkName: string
  checkType: "numeric" | "text" | "pass_fail"
  unit?: string
  specification?: string
  targetValue?: number
  minValue?: number
  maxValue?: number
  frequency?: string
  sampleSize?: string
  isCritical: boolean
  sequenceOrder: number
}

export interface AIGeneratedStep {
  stepName: string
  stage?: string
  instructions: string
  equipmentType?: string
  estimatedDurationMinutes?: number
  requiresLineClearance: boolean
  requiresEnvironmentalCheck: boolean
  envTempMin?: number
  envTempMax?: number
  envHumidityMin?: number
  envHumidityMax?: number
  parameters: AIGeneratedParameter[]
  ipcChecks: AIGeneratedIPCCheck[]
  rationale: string
}

export async function generateMBRStep(params: {
  description: string
  productName?: string
  dosageForm?: string
  existingStepCount: number
}): Promise<AIGeneratedStep> {
  const { description, productName, dosageForm, existingStepCount } = params

  const prompt = `You are a pharmaceutical manufacturing expert helping author a Master Batch Record (MBR) step.

Product context:
- Product: ${productName ?? "Unknown"}
- Dosage Form: ${dosageForm ?? "Unknown"}
- This will be step #${existingStepCount + 1}

The user describes this manufacturing step in plain English:
"${description}"

Generate a complete, GMP-compliant MBR step definition. Apply pharmaceutical manufacturing best practices and industry-standard parameter limits where applicable.

Respond in valid JSON with this exact structure:
{
  "stepName": "concise step name (e.g. 'Wet Granulation', 'Blend Lubrication')",
  "stage": "one of: Dispensing | Pre-processing | Manufacturing | In-Process Control | Coating | Packaging | Finishing | Quality Control | Cleaning | Other",
  "instructions": "detailed step-by-step instructions for operators (3-8 sentences, use numbered sub-steps if helpful)",
  "equipmentType": "specific equipment type (e.g. 'Rapid Mixer Granulator', 'V-Blender', 'Rotary Tablet Press')",
  "estimatedDurationMinutes": 30,
  "requiresLineClearance": true or false,
  "requiresEnvironmentalCheck": true or false,
  "envTempMin": null or number (°C, only if requiresEnvironmentalCheck true),
  "envTempMax": null or number (°C),
  "envHumidityMin": null or number (% RH),
  "envHumidityMax": null or number (% RH),
  "parameters": [
    {
      "parameterName": "parameter name",
      "parameterType": "numeric",
      "unit": "rpm",
      "targetValue": "500",
      "minValue": 400,
      "maxValue": 600,
      "isCritical": false,
      "sequenceOrder": 1
    }
  ],
  "ipcChecks": [
    {
      "checkName": "check name",
      "checkType": "numeric",
      "unit": "%",
      "specification": "NMT 2.0% RSD",
      "targetValue": null or number,
      "minValue": null or number,
      "maxValue": null or number,
      "frequency": "Every 30 minutes",
      "sampleSize": "10 units",
      "isCritical": false,
      "sequenceOrder": 1
    }
  ],
  "rationale": "1-2 sentence explanation of key design choices and why certain parameters/checks were included"
}

Rules:
- Include 2-5 process parameters typical for this step type
- Include 1-3 IPC checks appropriate for the step
- Mark parameters/checks as critical if they directly affect product quality or patient safety
- Use standard pharmaceutical industry limits where known (e.g., blending time, temperature ranges)
- If an IPC check is pass/fail, set minValue/maxValue to null
- All numeric limits must be scientifically reasonable`

  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { model: MODELS.SMART, maxTokens: 2000, responseFormat: "json" }
  )

  try {
    const parsed = JSON.parse(result.content) as AIGeneratedStep
    return parsed
  } catch {
    throw new Error("AI returned invalid JSON for step generation")
  }
}
