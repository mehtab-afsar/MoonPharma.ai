"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Hash, RefreshCw } from "lucide-react"

const schema = z.object({
  batchPrefix: z.string().min(1).max(10),
  batchNumberReset: z.enum(["yearly", "monthly", "never"]),
  deviationPrefix: z.string().min(1).max(10),
  changeControlPrefix: z.string().min(1).max(10),
})

type FormData = z.infer<typeof schema>

const YEAR = new Date().getFullYear()

function Preview({ prefix, reset }: { prefix: string; reset: string }) {
  const suffix = reset === "yearly" ? `${YEAR}-001` : reset === "monthly" ? `${YEAR}03-001` : "0001"
  return (
    <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">
      {prefix || "?"}-{suffix}
    </span>
  )
}

export default function NumberingPage() {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      batchPrefix: "B",
      batchNumberReset: "yearly",
      deviationPrefix: "DEV",
      changeControlPrefix: "CC",
    },
  })

  const [batchPrefix, batchNumberReset, deviationPrefix, changeControlPrefix] = watch([
    "batchPrefix",
    "batchNumberReset",
    "deviationPrefix",
    "changeControlPrefix",
  ])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/config")
        if (res.ok) {
          const { data } = await res.json()
          reset({
            batchPrefix: data.batchPrefix,
            batchNumberReset: data.batchNumberReset,
            deviationPrefix: data.deviationPrefix,
            changeControlPrefix: data.changeControlPrefix,
          })
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
          <Hash className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Numbering Formats</h1>
          <p className="text-sm text-gray-500">Configure prefixes and reset periods for document numbers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {/* Batch number */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Batch Number</h3>
                <p className="text-xs text-gray-400 mt-0.5">Used for all manufacturing batch records</p>
              </div>
              <Preview prefix={batchPrefix} reset={batchNumberReset} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Prefix</label>
                <input
                  {...register("batchPrefix")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="B"
                />
                {errors.batchPrefix && <p className="text-xs text-red-500">{errors.batchPrefix.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Counter reset</label>
                <select
                  {...register("batchNumberReset")}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="yearly">Yearly (001 resets each year)</option>
                  <option value="monthly">Monthly (001 resets each month)</option>
                  <option value="never">Never (always incrementing)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deviation number */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Deviation Number</h3>
                <p className="text-xs text-gray-400 mt-0.5">Used for deviation reports</p>
              </div>
              <Preview prefix={deviationPrefix} reset={batchNumberReset} />
            </div>
            <div className="space-y-1 w-1/2">
              <label className="text-xs font-medium text-gray-600">Prefix</label>
              <input
                {...register("deviationPrefix")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="DEV"
              />
              {errors.deviationPrefix && <p className="text-xs text-red-500">{errors.deviationPrefix.message}</p>}
            </div>
          </div>

          {/* Change control number */}
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Change Control Number</h3>
                <p className="text-xs text-gray-400 mt-0.5">Used for change control records</p>
              </div>
              <Preview prefix={changeControlPrefix} reset={batchNumberReset} />
            </div>
            <div className="space-y-1 w-1/2">
              <label className="text-xs font-medium text-gray-600">Prefix</label>
              <input
                {...register("changeControlPrefix")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="CC"
              />
              {errors.changeControlPrefix && <p className="text-xs text-red-500">{errors.changeControlPrefix.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {saved && (
            <span className="text-sm text-green-600 font-medium">Saved successfully</span>
          )}
          <div className="ml-auto flex gap-3">
            <button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
