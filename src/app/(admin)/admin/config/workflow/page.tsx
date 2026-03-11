"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { GitBranch, RefreshCw } from "lucide-react"

const schema = z.object({
  qaReviewStages: z.number().int().min(2).max(3),
  requireLineClearance: z.boolean(),
  autoDeviationOnOos: z.boolean(),
  criticalDeviationHold: z.boolean(),
  eSignatureMethod: z.enum(["pin_only", "password_only", "password_and_pin"]),
  sessionTimeoutMinutes: z.number().int().min(30).max(1440),
  failedLoginLockout: z.number().int().min(3).max(10),
  defaultYieldMin: z.number().min(80).max(100),
  defaultYieldMax: z.number().min(95).max(110),
  defaultMaterialTolerance: z.number().min(0).max(10),
})

type FormData = z.infer<typeof schema>

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-black" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  )
}

function Row({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="ml-4">{children}</div>
    </div>
  )
}

export default function WorkflowPage() {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      qaReviewStages: 2,
      requireLineClearance: true,
      autoDeviationOnOos: true,
      criticalDeviationHold: true,
      eSignatureMethod: "pin_only",
      sessionTimeoutMinutes: 480,
      failedLoginLockout: 5,
      defaultYieldMin: 95.0,
      defaultYieldMax: 102.0,
      defaultMaterialTolerance: 2.0,
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/config")
        if (res.ok) {
          const { data } = await res.json()
          reset(data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reset])

  async function onSubmit(values: FormData) {
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      reset(values)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 animate-pulse">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center">
          <GitBranch className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Workflow Rules</h1>
          <p className="text-sm text-gray-500">Configure review stages, e-signatures, and safety rules</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Section title="Quality Review">
          <Row label="QA Review Stages" description="Number of sequential QA approvals required before batch release">
            <Controller
              name="qaReviewStages"
              control={control}
              render={({ field }) => (
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  {[2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => field.onChange(n)}
                      className={`px-4 py-1.5 text-sm font-medium transition-colors ${field.value === n ? "bg-black text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      {n} stages
                    </button>
                  ))}
                </div>
              )}
            />
          </Row>
          <Row label="Require Line Clearance" description="Operators must verify area and equipment cleanliness before each batch step">
            <Controller
              name="requireLineClearance"
              control={control}
              render={({ field }) => <Toggle value={field.value} onChange={field.onChange} />}
            />
          </Row>
          <Row label="Auto-create Deviation on OOS" description="Automatically generate a deviation when a parameter is out of specification">
            <Controller
              name="autoDeviationOnOos"
              control={control}
              render={({ field }) => <Toggle value={field.value} onChange={field.onChange} />}
            />
          </Row>
          <Row label="Critical Deviation Auto-holds Batch" description="Batch status is set to 'on hold' when a critical deviation is raised">
            <Controller
              name="criticalDeviationHold"
              control={control}
              render={({ field }) => <Toggle value={field.value} onChange={field.onChange} />}
            />
          </Row>
        </Section>

        <Section title="E-Signature">
          <Row label="Signature Method" description="How users authenticate for two-person verification">
            <Controller
              name="eSignatureMethod"
              control={control}
              render={({ field }) => (
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="pin_only">PIN only</option>
                  <option value="password_only">Password only</option>
                  <option value="password_and_pin">Password + PIN</option>
                </select>
              )}
            />
          </Row>
          <Row label="Session Timeout" description="Minutes of inactivity before a user is signed out">
            <div className="flex items-center gap-2">
              <input
                type="number"
                {...register("sessionTimeoutMinutes", { valueAsNumber: true })}
                className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black text-right"
              />
              <span className="text-sm text-gray-500">min</span>
            </div>
          </Row>
          <Row label="Failed Login Lockout" description="Account locks after this many consecutive failed logins">
            <div className="flex items-center gap-2">
              <input
                type="number"
                {...register("failedLoginLockout", { valueAsNumber: true })}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black text-right"
              />
              <span className="text-sm text-gray-500">attempts</span>
            </div>
          </Row>
        </Section>

        <Section title="Default Specifications">
          <Row label="Default Yield Range" description="Acceptable batch yield range (%) used when no product-specific value is set">
            <div className="flex items-center gap-2 text-sm">
              <input
                type="number"
                step="0.1"
                {...register("defaultYieldMin", { valueAsNumber: true })}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-right"
              />
              <span className="text-gray-400">–</span>
              <input
                type="number"
                step="0.1"
                {...register("defaultYieldMax", { valueAsNumber: true })}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-right"
              />
              <span className="text-gray-500">%</span>
            </div>
          </Row>
          <Row label="Default Material Tolerance" description="Weighing tolerance (±%) when no material-specific tolerance is set">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">±</span>
              <input
                type="number"
                step="0.1"
                {...register("defaultMaterialTolerance", { valueAsNumber: true })}
                className="w-20 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black text-right"
              />
              <span className="text-gray-500">%</span>
            </div>
          </Row>
        </Section>

        <div className="flex items-center justify-between">
          {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className="ml-auto px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-2"
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
