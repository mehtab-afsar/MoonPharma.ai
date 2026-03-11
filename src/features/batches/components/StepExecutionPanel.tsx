"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Play, CheckCircle2, Thermometer, Wrench, ClipboardList, FlaskConical, UserCheck, ShieldCheck, X, AlertTriangle } from "lucide-react"
import { DeviationQuickLogModal } from "./DeviationQuickLogModal"

interface Parameter {
  id: string
  parameterName: string
  parameterType: string
  unit?: string | null
  minValue?: number | null
  maxValue?: number | null
  expectedValue?: string | null
  options?: string | null
  isRequired: boolean
  recordedValue?: string | null
}

interface IPCCheck {
  id: string
  checkName: string
  checkType: string
  specification: string
  unit?: string | null
  minValue?: number | null
  maxValue?: number | null
  recordedValue?: string | null
  passed?: boolean | null
}

interface Equipment {
  id: string
  equipment: {
    name: string
    equipmentCode: string
  }
}

interface StepDetail {
  id: string
  stepNumber: number
  status: string
  startedAt: string | null
  completedAt: string | null
  mbrStep: {
    stepName: string
    stage: string
    instructions: string
    minTemp?: number | null
    maxTemp?: number | null
    minHumidity?: number | null
    maxHumidity?: number | null
    minPressure?: number | null
    maxPressure?: number | null
    parameters: Parameter[]
    ipcChecks: IPCCheck[]
    equipment: Equipment[]
  }
}

interface StepExecutionPanelProps {
  step: StepDetail
  batchId: string
  onStepUpdate: () => void
}

export function StepExecutionPanel({ step, batchId, onStepUpdate }: StepExecutionPanelProps) {
  const [isStarting, setIsStarting] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [showDeviationModal, setShowDeviationModal] = useState(false)

  // Parameter values state: paramId -> value string
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    step.mbrStep.parameters.forEach((p) => {
      initial[p.id] = p.recordedValue ?? ""
    })
    return initial
  })

  // IPC check values state: checkId -> value string
  const [ipcValues, setIpcValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    step.mbrStep.ipcChecks.forEach((c) => {
      initial[c.id] = c.recordedValue ?? ""
    })
    return initial
  })

  // IPC pass/fail overrides
  const [ipcPassed, setIpcPassed] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    step.mbrStep.ipcChecks.forEach((c) => {
      initial[c.id] = c.passed ?? false
    })
    return initial
  })

  // Step sign-off fields
  const [remarks, setRemarks] = useState("")
  const [areaCleanVerified, setAreaCleanVerified] = useState(false)
  const [equipmentCleanVerified, setEquipmentCleanVerified] = useState(false)

  // PIN-based e-signature
  const [sigEmployeeId, setSigEmployeeId] = useState("")
  const [sigPin, setSigPin] = useState("")
  const [isVerifyingPin, setIsVerifyingPin] = useState(false)
  const [verifiedUser, setVerifiedUser] = useState<{ userId: string; fullName: string; employeeId: string } | null>(null)

  async function handleVerifyPin() {
    if (!sigEmployeeId.trim() || !sigPin.trim()) {
      toast.error("Enter verifier employee ID and PIN.")
      return
    }
    setIsVerifyingPin(true)
    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: sigEmployeeId.trim(), pin: sigPin.trim() }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "PIN verification failed.")
        setSigPin("")
        return
      }
      setVerifiedUser(result.data)
      setSigPin("") // clear PIN from memory
      toast.success(`Verified: ${result.data.fullName}`)
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsVerifyingPin(false)
    }
  }

  function resetSignature() {
    setVerifiedUser(null)
    setSigEmployeeId("")
    setSigPin("")
  }

  const isInProgress = step.status === "in_progress"
  const isCompleted = step.status === "completed"
  const isPending = step.status === "pending"

  async function handleStartStep() {
    setIsStarting(true)
    try {
      const res = await fetch(`/api/batches/${batchId}/steps/${step.id}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "Failed to start step.")
        return
      }
      toast.success("Step started.")
      onStepUpdate()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsStarting(false)
    }
  }

  async function handleCompleteStep() {
    // Validate required parameters
    const missingRequired = step.mbrStep.parameters.filter(
      (p) => p.isRequired && !paramValues[p.id]
    )
    if (missingRequired.length > 0) {
      toast.error(`Fill in required parameters: ${missingRequired.map((p) => p.parameterName).join(", ")}`)
      return
    }

    if (!verifiedUser) {
      toast.error("Step must be verified with a second person's PIN before completing.")
      return
    }

    setIsCompleting(true)
    try {
      let oosCount = 0

      // 1. Save each parameter to the parameters endpoint
      for (const param of step.mbrStep.parameters) {
        const value = paramValues[param.id]
        if (!value) continue
        const res = await fetch(`/api/batches/${batchId}/steps/${step.id}/parameters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mbrStepParameterId: param.id,
            parameterName: param.parameterName,
            actualValue: value,
            actualNumericValue:
              param.parameterType === "numeric" ? parseFloat(value) : undefined,
            minValue: param.minValue ?? undefined,
            maxValue: param.maxValue ?? undefined,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.isWithinLimit === false) {
            oosCount++
            if (data.data?.oosDeviation) {
              toast.warning(
                `OOS: ${param.parameterName} — deviation ${data.data.oosDeviation.deviationNumber} auto-raised`,
                { duration: 6000 }
              )
            }
          }
        }
      }

      // 2. Save each IPC result to the ipc-results endpoint
      for (const check of step.mbrStep.ipcChecks) {
        const value = ipcValues[check.id]
        if (!value) continue
        const res = await fetch(`/api/batches/${batchId}/steps/${step.id}/ipc-results`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mbrIpcId: check.id,
            checkName: check.checkName,
            checkTime: new Date().toISOString(),
            resultValue: value,
            resultNumeric:
              check.checkType === "numeric" ? parseFloat(value) : undefined,
            minValue: check.minValue ?? undefined,
            maxValue: check.maxValue ?? undefined,
            remarks: ipcPassed[check.id] ? undefined : "Failed",
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.data?.isWithinSpec === false) {
            oosCount++
            if (data.data?.oosDeviation) {
              toast.warning(
                `OOS IPC: ${check.checkName} — deviation ${data.data.oosDeviation.deviationNumber} auto-raised`,
                { duration: 6000 }
              )
            }
          }
        }
      }

      // 3. Mark step complete
      const res = await fetch(`/api/batches/${batchId}/steps/${step.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verifiedById: verifiedUser.userId,
          remarks: remarks.trim() || undefined,
          areaCleanVerified,
          equipmentCleanVerified,
        }),
      })

      const result = await res.json()
      if (!res.ok) {
        toast.error(result.message ?? "Failed to complete step.")
        return
      }
      if (oosCount === 0) {
        toast.success("Step completed.")
      } else {
        toast.success(`Step completed with ${oosCount} OOS deviation${oosCount > 1 ? "s" : ""} raised.`)
      }
      onStepUpdate()
    } catch {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsCompleting(false)
    }
  }

  const hasEnvRequirements =
    step.mbrStep.minTemp != null ||
    step.mbrStep.maxTemp != null ||
    step.mbrStep.minHumidity != null ||
    step.mbrStep.maxHumidity != null ||
    step.mbrStep.minPressure != null ||
    step.mbrStep.maxPressure != null

  return (
    <div className="space-y-5">
      {/* Step Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-gray-400">Step {step.stepNumber}</span>
            {step.mbrStep.stage && (
              <Badge variant="secondary" className="text-xs">
                {step.mbrStep.stage}
              </Badge>
            )}
          </div>
          <h2 className="mt-1 text-xl font-semibold text-gray-900">{step.mbrStep.stepName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {(isInProgress || isPending) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeviationModal(true)}
              className="gap-1.5 text-gray-600 border-gray-200"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Log Deviation
            </Button>
          )}
          {isPending && (
            <Button
              onClick={handleStartStep}
              disabled={isStarting}
              className="gap-2 bg-black text-white hover:bg-gray-800"
            >
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start Step
            </Button>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1.5 text-gray-600 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {step.mbrStep.instructions}
          </p>
        </CardContent>
      </Card>

      {/* Environmental Requirements */}
      {hasEnvRequirements && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              Environmental Requirements
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            {(step.mbrStep.minTemp != null || step.mbrStep.maxTemp != null) && (
              <div>
                <p className="text-xs text-gray-500">Temperature</p>
                <p className="text-sm font-medium text-gray-800">
                  {step.mbrStep.minTemp != null ? `${step.mbrStep.minTemp}°C` : "—"}
                  {" – "}
                  {step.mbrStep.maxTemp != null ? `${step.mbrStep.maxTemp}°C` : "—"}
                </p>
              </div>
            )}
            {(step.mbrStep.minHumidity != null || step.mbrStep.maxHumidity != null) && (
              <div>
                <p className="text-xs text-gray-500">Humidity (%RH)</p>
                <p className="text-sm font-medium text-gray-800">
                  {step.mbrStep.minHumidity != null ? `${step.mbrStep.minHumidity}%` : "—"}
                  {" – "}
                  {step.mbrStep.maxHumidity != null ? `${step.mbrStep.maxHumidity}%` : "—"}
                </p>
              </div>
            )}
            {(step.mbrStep.minPressure != null || step.mbrStep.maxPressure != null) && (
              <div>
                <p className="text-xs text-gray-500">Pressure (Pa)</p>
                <p className="text-sm font-medium text-gray-800">
                  {step.mbrStep.minPressure != null ? `${step.mbrStep.minPressure}` : "—"}
                  {" – "}
                  {step.mbrStep.maxPressure != null ? `${step.mbrStep.maxPressure}` : "—"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment */}
      {step.mbrStep.equipment.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {step.mbrStep.equipment.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm"
              >
                <span className="font-medium text-gray-800">{eq.equipment.name}</span>
                <span className="font-mono text-xs text-gray-400">{eq.equipment.equipmentCode}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Parameters */}
      {step.mbrStep.parameters.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Process Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step.mbrStep.parameters.map((param) => (
              <div key={param.id} className="space-y-1.5">
                <Label className="text-sm text-gray-700">
                  {param.parameterName}
                  {param.isRequired && <span className="ml-1 text-red-500">*</span>}
                  {param.unit && (
                    <span className="ml-1 text-xs text-gray-400">({param.unit})</span>
                  )}
                  {param.minValue != null && param.maxValue != null && (
                    <span className="ml-2 text-xs text-gray-400">
                      Range: {param.minValue} – {param.maxValue}
                    </span>
                  )}
                </Label>

                {param.parameterType === "boolean" ? (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`param-${param.id}`}
                      checked={paramValues[param.id] === "true"}
                      onCheckedChange={(checked) =>
                        setParamValues((prev) => ({
                          ...prev,
                          [param.id]: checked ? "true" : "false",
                        }))
                      }
                      disabled={!isInProgress}
                    />
                    <label htmlFor={`param-${param.id}`} className="text-sm text-gray-700">
                      {paramValues[param.id] === "true" ? "Yes" : "No"}
                    </label>
                  </div>
                ) : param.parameterType === "selection" && param.options ? (
                  <select
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
                    value={paramValues[param.id] ?? ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.id]: e.target.value }))
                    }
                    disabled={!isInProgress}
                  >
                    <option value="">Select...</option>
                    {param.options.split(",").map((opt) => (
                      <option key={opt.trim()} value={opt.trim()}>
                        {opt.trim()}
                      </option>
                    ))}
                  </select>
                ) : param.parameterType === "numeric" ? (
                  <Input
                    type="number"
                    step="0.001"
                    placeholder={
                      param.expectedValue ??
                      (param.minValue != null && param.maxValue != null
                        ? `${param.minValue} – ${param.maxValue}`
                        : "Enter value")
                    }
                    value={paramValues[param.id] ?? ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.id]: e.target.value }))
                    }
                    disabled={!isInProgress}
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder={param.expectedValue ?? "Enter value"}
                    value={paramValues[param.id] ?? ""}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.id]: e.target.value }))
                    }
                    disabled={!isInProgress}
                  />
                )}

                {/* Out of range indicator for numeric */}
                {param.parameterType === "numeric" &&
                  paramValues[param.id] &&
                  param.minValue != null &&
                  param.maxValue != null && (
                    (() => {
                      const val = parseFloat(paramValues[param.id])
                      const inRange = !isNaN(val) && val >= param.minValue! && val <= param.maxValue!
                      return (
                        <p className={`text-xs ${inRange ? "text-green-600" : "text-red-600"}`}>
                          {inRange ? "Within specification" : `Out of range (${param.minValue} – ${param.maxValue})`}
                        </p>
                      )
                    })()
                  )}

                {isCompleted && param.recordedValue && (
                  <p className="text-xs text-gray-500">
                    Recorded: <span className="font-medium">{param.recordedValue}</span>
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* IPC Checks */}
      {step.mbrStep.ipcChecks.length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              In-Process Controls (IPC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {step.mbrStep.ipcChecks.map((check) => (
              <div key={check.id} className="space-y-1.5 rounded-md border border-gray-100 p-3">
                <Label className="text-sm font-medium text-gray-800">
                  {check.checkName}
                </Label>
                <p className="text-xs text-gray-500">
                  Specification: {check.specification}
                  {check.unit && ` (${check.unit})`}
                  {check.minValue != null && check.maxValue != null && (
                    <span> | Range: {check.minValue} – {check.maxValue}</span>
                  )}
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    placeholder="Enter result"
                    value={ipcValues[check.id] ?? ""}
                    onChange={(e) =>
                      setIpcValues((prev) => ({ ...prev, [check.id]: e.target.value }))
                    }
                    disabled={!isInProgress}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id={`ipc-pass-${check.id}`}
                      checked={ipcPassed[check.id] ?? false}
                      onCheckedChange={(checked) =>
                        setIpcPassed((prev) => ({ ...prev, [check.id]: !!checked }))
                      }
                      disabled={!isInProgress}
                    />
                    <label
                      htmlFor={`ipc-pass-${check.id}`}
                      className="text-sm text-gray-700 whitespace-nowrap"
                    >
                      Passed
                    </label>
                  </div>
                </div>
                {isCompleted && check.recordedValue && (
                  <p className="text-xs text-gray-500">
                    Recorded: <span className="font-medium">{check.recordedValue}</span>
                    {check.passed != null && (
                      <span className={`ml-2 ${check.passed ? "text-green-600" : "text-red-600"}`}>
                        ({check.passed ? "Pass" : "Fail"})
                      </span>
                    )}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step Sign-Off (only when in progress) */}
      {isInProgress && (
        <Card className="border border-gray-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Step Sign-Off
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

            {/* E-Signature block */}
            {verifiedUser ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-gray-700" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{verifiedUser.fullName}</p>
                    <p className="text-xs text-gray-500">{verifiedUser.employeeId} · Signature verified</p>
                  </div>
                </div>
                <button onClick={resetSignature} className="text-gray-400 hover:text-gray-700 ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 p-4">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  Verifier E-Signature <span className="text-red-500">*</span>
                </p>
                <p className="text-xs text-gray-400">
                  A second person must verify this step using their employee ID and PIN (21 CFR Part 11).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Verifier Employee ID</Label>
                    <Input
                      placeholder="e.g. EMP-042"
                      value={sigEmployeeId}
                      onChange={(e) => setSigEmployeeId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">4-Digit PIN</Label>
                    <Input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={sigPin}
                      onChange={(e) => setSigPin(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyPin()}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleVerifyPin}
                  disabled={isVerifyingPin}
                  className="w-full"
                >
                  {isVerifyingPin ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Verifying...</>
                  ) : (
                    <><ShieldCheck className="h-3.5 w-3.5 mr-2" /> Verify Signature</>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="remarks" className="text-sm">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Any observations or notes for this step..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="areaClean"
                  checked={areaCleanVerified}
                  onCheckedChange={(v) => setAreaCleanVerified(!!v)}
                />
                <label htmlFor="areaClean" className="text-sm text-gray-700">
                  Area cleanliness verified
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="equipmentClean"
                  checked={equipmentCleanVerified}
                  onCheckedChange={(v) => setEquipmentCleanVerified(!!v)}
                />
                <label htmlFor="equipmentClean" className="text-sm text-gray-700">
                  Equipment cleanliness verified
                </label>
              </div>
            </div>

            <Button
              onClick={handleCompleteStep}
              disabled={isCompleting || !verifiedUser}
              className="w-full gap-2 bg-black text-white hover:bg-gray-800 disabled:opacity-40"
            >
              {isCompleting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Completing Step...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4" /> Complete Step</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step Timestamps */}
      {(step.startedAt || step.completedAt) && (
        <div className="flex gap-6 text-xs text-gray-400">
          {step.startedAt && (
            <span>
              Started:{" "}
              {new Date(step.startedAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {step.completedAt && (
            <span>
              Completed:{" "}
              {new Date(step.completedAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {/* Deviation Quick Log Modal */}
      <DeviationQuickLogModal
        open={showDeviationModal}
        onClose={() => setShowDeviationModal(false)}
        batchId={batchId}
        batchStepId={step.id}
        stepName={step.mbrStep.stepName}
        onLogged={onStepUpdate}
      />
    </div>
  )
}
