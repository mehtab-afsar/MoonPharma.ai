"use client"

import { useEffect, useState } from "react"
import { Loader2, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

type LifecycleState = {
  id: string
  code: string
  label: string
  color: string
  isInitial: boolean
  isTerminal: boolean
  sortOrder: number
}

type LifecycleTransition = {
  id: string
  fromStateId: string
  toStateId: string
  action: string
  label: string
  requiredRoles: string[]
  requiresSignature: boolean
}

type OntologyLifecycle = {
  id: string
  name: string
  isSystem: boolean
  entity: { id: string; name: string; displayName: string }
  states: LifecycleState[]
  transitions: LifecycleTransition[]
}

export default function LifecyclesPage() {
  const [lifecycles, setLifecycles] = useState<OntologyLifecycle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/ontology/lifecycles")
        const data = await res.json()
        if (data.success) {
          setLifecycles(data.data)
          if (data.data.length > 0) setSelectedId(data.data[0].id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selected = lifecycles.find((lc) => lc.id === selectedId) ?? null

  const stateById = (stateId: string) =>
    selected?.states.find((s) => s.id === stateId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Lifecycles</h1>
        <p className="text-sm text-gray-500 mt-0.5">State machines for entity status transitions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex gap-5">
          {/* Left sidebar */}
          <div className="w-64 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {lifecycles.length} Lifecycle{lifecycles.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-50">
                {lifecycles.map((lc) => (
                  <button
                    key={lc.id}
                    onClick={() => setSelectedId(lc.id)}
                    className={cn(
                      "w-full flex flex-col gap-0.5 px-4 py-3 text-left transition-colors",
                      selectedId === lc.id
                        ? "bg-black text-white"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <span className="text-sm font-medium truncate">{lc.entity.displayName} Lifecycle</span>
                    <span className={cn("text-xs truncate", selectedId === lc.id ? "text-white/60" : "text-gray-400")}>
                      {lc.states.length} states · {lc.transitions.length} transitions
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 min-w-0 space-y-4">
            {!selected ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Select a lifecycle
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">
                      {selected.entity.displayName} Lifecycle
                    </h2>
                    {selected.isSystem && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 flex items-center gap-0.5">
                        <Shield className="h-2.5 w-2.5" /> System
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{selected.name}</p>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">States</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.states.map((s) => (
                        <div
                          key={s.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white inline-flex items-center gap-1.5"
                          style={{ backgroundColor: s.color }}
                        >
                          <span>{s.label}</span>
                          {s.isInitial && (
                            <span className="text-white/70 text-xs">(Initial)</span>
                          )}
                          {s.isTerminal && (
                            <span className="text-white/70 text-xs">(Terminal)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transitions */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Transitions</p>
                  </div>
                  {selected.transitions.length === 0 ? (
                    <div className="text-center py-8 text-sm text-gray-400">No transitions defined</div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">From State</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">To State</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Roles</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sig Required</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selected.transitions.map((t) => {
                          const fromState = stateById(t.fromStateId)
                          const toState = stateById(t.toStateId)
                          return (
                            <tr key={t.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3">
                                {fromState ? (
                                  <span
                                    className="text-xs font-medium px-2 py-1 rounded text-white"
                                    style={{ backgroundColor: fromState.color }}
                                  >
                                    {fromState.label}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-600">{t.action}</td>
                              <td className="px-4 py-3">
                                {toState ? (
                                  <span
                                    className="text-xs font-medium px-2 py-1 rounded text-white"
                                    style={{ backgroundColor: toState.color }}
                                  >
                                    {toState.label}
                                  </span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500">
                                {t.requiredRoles.join(", ")}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-500">
                                {t.requiresSignature ? "✓" : "—"}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
