"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, ChevronUp } from "lucide-react"


interface MBRStepParameter {
  id: string
  parameterName: string
  parameterType: string
  unit?: string | null
  targetValue?: string | null
  minValue?: unknown
  maxValue?: unknown
  isCritical: boolean
  sequenceOrder: number
}

interface MBRIPCCheck {
  id: string
  checkName: string
  checkType: string
  unit?: string | null
  specification?: string | null
  targetValue?: unknown
  minValue?: unknown
  maxValue?: unknown
  frequency?: string | null
  sampleSize?: string | null
  isCritical: boolean
  sequenceOrder: number
}

interface MBRStep {
  id: string
  stepNumber: number
  stepName: string
  stage?: string | null
  instructions: string
  equipmentType?: string | null
  estimatedDurationMinutes?: number | null
  requiresLineClearance: boolean
  requiresEnvironmentalCheck: boolean
  envTempMin?: unknown
  envTempMax?: unknown
  envHumidityMin?: unknown
  envHumidityMax?: unknown
  parameters: MBRStepParameter[]
  ipcChecks: MBRIPCCheck[]
}

export function MBRStepsAccordion({ steps }: { steps: MBRStep[] }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  function toggleStep(stepId: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  if (steps.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        No steps defined.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {steps.map((step) => {
        const isExpanded = expandedSteps.has(step.id)
        return (
          <div key={step.id}>
            <div
              className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-gray-50/50"
              onClick={() => toggleStep(step.id)}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {step.stepNumber}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.stepName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {step.stage && (
                    <span className="text-xs text-gray-400">{step.stage}</span>
                  )}
                  {step.estimatedDurationMinutes && (
                    <span className="text-xs text-gray-400">· {step.estimatedDurationMinutes} min</span>
                  )}
                  {step.parameters.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {step.parameters.length} param{step.parameters.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                  {step.ipcChecks.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-green-50 text-green-700">
                      {step.ipcChecks.length} IPC
                    </Badge>
                  )}
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              )}
            </div>

            {isExpanded && (
              <div className="px-6 pb-5 space-y-4 pl-16">
                {/* Instructions */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Instructions
                  </p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-200 pl-3">
                    {step.instructions}
                  </p>
                </div>

                {/* Step metadata */}
                <div className="flex flex-wrap gap-2">
                  {step.equipmentType && (
                    <Badge variant="outline" className="text-xs">
                      Equipment: {step.equipmentType}
                    </Badge>
                  )}
                  {step.requiresLineClearance && (
                    <Badge variant="outline" className="text-xs border-yellow-200 text-yellow-700 bg-yellow-50">
                      Line Clearance Required
                    </Badge>
                  )}
                  {step.requiresEnvironmentalCheck && (
                    <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                      Env. Check: {Number(step.envTempMin)}–{Number(step.envTempMax)}°C,{" "}
                      {Number(step.envHumidityMin)}–{Number(step.envHumidityMax)}% RH
                    </Badge>
                  )}
                </div>

                {/* Process Parameters */}
                {step.parameters.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Process Parameters
                      </p>
                      <div className="space-y-1.5">
                        {step.parameters.map((param) => (
                          <div
                            key={param.id}
                            className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">
                                {param.parameterName}
                              </span>
                              <span className="text-gray-400 capitalize">{param.parameterType}</span>
                              {param.unit && (
                                <span className="text-gray-400">· {param.unit}</span>
                              )}
                              {param.targetValue && (
                                <span className="text-gray-600">Target: {param.targetValue}</span>
                              )}
                              {param.minValue != null && param.maxValue != null && (
                                <span className="text-gray-500">
                                  Range: {Number(param.minValue)} – {Number(param.maxValue)}
                                </span>
                              )}
                            </div>
                            {param.isCritical && (
                              <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 py-0">
                                Critical
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* IPC Checks */}
                {step.ipcChecks.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        In-Process Checks (IPC)
                      </p>
                      <div className="space-y-1.5">
                        {step.ipcChecks.map((check) => (
                          <div
                            key={check.id}
                            className="flex items-center justify-between rounded-md bg-green-50/60 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-800">
                                {check.checkName}
                              </span>
                              <span className="text-gray-400 capitalize">
                                {check.checkType.replace("_", "/")}
                              </span>
                              {check.specification && (
                                <span className="text-gray-600">Spec: {check.specification}</span>
                              )}
                              {check.minValue != null && check.maxValue != null && (
                                <span className="text-gray-500">
                                  Range: {Number(check.minValue)} – {Number(check.maxValue)}
                                  {check.unit && ` ${check.unit}`}
                                </span>
                              )}
                              {check.frequency && (
                                <span className="text-gray-400">· {check.frequency}</span>
                              )}
                              {check.sampleSize && (
                                <span className="text-gray-400">n={check.sampleSize}</span>
                              )}
                            </div>
                            {check.isCritical && (
                              <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50 py-0 shrink-0">
                                Critical
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
