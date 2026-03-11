"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Database, Tag, GitFork, GitMerge, Network, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"

type OntologyEntity = {
  id: string
  name: string
  displayName: string
  group: string
}

type OntologyRelationship = { id: string }
type OntologyLifecycle = { id: string }
type OntologyConstraint = { id: string }

export default function OntologyOverviewPage() {
  const [entities, setEntities] = useState<OntologyEntity[]>([])
  const [relationships, setRelationships] = useState<OntologyRelationship[]>([])
  const [lifecycles, setLifecycles] = useState<OntologyLifecycle[]>([])
  const [constraints, setConstraints] = useState<OntologyConstraint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      try {
        const [entRes, relRes, lcRes, conRes] = await Promise.all([
          fetch("/api/ontology/entities"),
          fetch("/api/ontology/relationships"),
          fetch("/api/ontology/lifecycles"),
          fetch("/api/ontology/constraints"),
        ])
        const [entData, relData, lcData, conData] = await Promise.all([
          entRes.json(), relRes.json(), lcRes.json(), conRes.json(),
        ])
        if (entData.success) setEntities(entData.data)
        if (relData.success) setRelationships(relData.data)
        if (lcData.success) setLifecycles(lcData.data)
        if (conData.success) setConstraints(conData.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadAll()
  }, [])

  const stats = [
    { label: "Entities", value: entities.length, sub: "Domain objects" },
    { label: "Relationships", value: relationships.length, sub: "Connections" },
    { label: "Lifecycles", value: lifecycles.length, sub: "State machines" },
    { label: "Constraints", value: constraints.length, sub: "Business rules" },
    { label: "Groups", value: 5, sub: "Entity groups" },
  ]

  const sections = [
    {
      href: "/ontology/entities",
      icon: Database,
      label: "Entities",
      count: entities.length,
      description: "Manage domain entities and their attributes",
    },
    {
      href: "/ontology/relationships",
      icon: GitFork,
      label: "Relationships",
      count: relationships.length,
      description: "Define how entities connect",
    },
    {
      href: "/ontology/lifecycles",
      icon: GitMerge,
      label: "Lifecycles",
      count: lifecycles.length,
      description: "State machines for entity status",
    },
    {
      href: "/ontology/attributes",
      icon: Tag,
      label: "Attributes",
      count: null,
      description: "Browse all attributes across entities",
    },
    {
      href: "/ontology/process-graph",
      icon: Network,
      label: "Process Graphs",
      count: null,
      description: "Visual workflow designer",
    },
    {
      href: "/ontology/constraints",
      icon: ShieldCheck,
      label: "Constraints",
      count: constraints.length,
      description: "Business rules and validation",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ontology</h1>
        <p className="text-sm text-gray-500 mt-1">Your pharmaceutical domain model</p>
      </div>

      {/* Stats Row */}
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Domain Map */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-900 mb-5">Domain Map</p>
        <div className="space-y-4">
          {/* Row 1 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label="Product" />
            <Arrow />
            <Chip label="MBR" />
            <Arrow />
            <Chip label="Batch" />
            <Arrow />
            <Chip label="Reviews" />
          </div>
          {/* Row 2 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label="Batch" />
            <Arrow />
            <Chip label="Deviations" />
            <Arrow />
            <Chip label="CAPA" />
          </div>
          {/* Row 3 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Chip label="Materials" />
            <span className="text-gray-300 text-xs">+</span>
            <Chip label="Equipment" />
            <Arrow />
            <Chip label="Batch" />
          </div>
        </div>
      </div>

      {/* Section Cards */}
      <div className="grid grid-cols-3 gap-4">
        {sections.map((sec) => (
          <Link
            key={sec.href}
            href={sec.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                <sec.icon className="h-4.5 w-4.5 text-gray-600" />
              </div>
              <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors mt-0.5" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-900">{sec.label}</p>
              {sec.count !== null && (
                <p className="text-xs text-gray-400 mt-0.5">{sec.count} items</p>
              )}
              <p className="text-xs text-gray-500 mt-1">{sec.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-xs font-medium bg-gray-900 text-white px-2.5 py-1 rounded-md">
      {label}
    </span>
  )
}

function Arrow() {
  return <span className="text-gray-300 text-sm font-light">→</span>
}
