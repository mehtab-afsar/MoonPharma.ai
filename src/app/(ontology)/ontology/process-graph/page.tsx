"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Save, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

type ProcessGraph = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}

type GraphNode = {
  id: string
  label: string
  nodeType: string
  entityId: string | null
  posX: number
  posY: number
  config: Record<string, unknown> | null
}

type GraphEdge = {
  id: string
  sourceNodeId: string
  targetNodeId: string
  label: string | null
  condition: string | null
}

type GraphDetail = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  nodes: GraphNode[]
  edges: GraphEdge[]
}

const NODE_TYPES_LIST = ["start", "end", "step", "decision", "entity", "document"]

function nodeStyleForType(nodeType: string): React.CSSProperties {
  switch (nodeType) {
    case "start":
    case "end":
      return { background: "#000", color: "#fff", border: "2px solid #000", borderRadius: "50%", padding: "8px 12px", fontSize: 12, fontWeight: 600 }
    case "step":
      return { background: "#fff", color: "#000", border: "2px solid #000", borderRadius: "8px", padding: "8px 12px", fontSize: 12 }
    case "decision":
      return { background: "#f3f4f6", color: "#000", border: "2px solid #374151", borderRadius: "4px", padding: "8px 12px", fontSize: 12, fontStyle: "italic" }
    case "entity":
      return { background: "#e5e7eb", color: "#111827", border: "2px solid #6b7280", borderRadius: "8px", padding: "8px 12px", fontSize: 12 }
    default:
      return { background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", padding: "8px 12px", fontSize: 12 }
  }
}

function dbNodeToFlowNode(n: GraphNode): Node {
  return {
    id: n.id,
    position: { x: n.posX, y: n.posY },
    data: { label: n.label, nodeType: n.nodeType },
    style: nodeStyleForType(n.nodeType),
  }
}

function dbEdgeToFlowEdge(e: GraphEdge): Edge {
  return {
    id: e.id,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label ?? undefined,
    animated: false,
  }
}

export default function ProcessGraphPage() {
  const [graphs, setGraphs] = useState<ProcessGraph[]>([])
  const [selectedId, setSelectedId] = useState<string>("")
  const [graphDetail, setGraphDetail] = useState<GraphDetail | null>(null)
  const [loadingGraphs, setLoadingGraphs] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showNewGraph, setShowNewGraph] = useState(false)
  const [newGraphName, setNewGraphName] = useState("")
  const [showAddNode, setShowAddNode] = useState(false)
  const [newNode, setNewNode] = useState({ label: "", nodeType: "step" })

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const loadGraphs = useCallback(async () => {
    const res = await fetch("/api/ontology/process-graphs")
    const data = await res.json()
    if (data.success) {
      setGraphs(data.data)
      if (data.data.length > 0 && !selectedId) setSelectedId(data.data[0].id)
    }
    setLoadingGraphs(false)
  }, [selectedId])

  const loadDetail = useCallback(async (id: string) => {
    setLoadingDetail(true)
    const res = await fetch(`/api/ontology/process-graphs/${id}`)
    const data = await res.json()
    if (data.success) {
      setGraphDetail(data.data)
      setNodes(data.data.nodes.map(dbNodeToFlowNode))
      setEdges(data.data.edges.map(dbEdgeToFlowEdge))
    }
    setLoadingDetail(false)
  }, [setNodes, setEdges])

  useEffect(() => { loadGraphs() }, [loadGraphs])
  useEffect(() => { if (selectedId) loadDetail(selectedId) }, [selectedId, loadDetail])

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  async function handleSave() {
    if (!selectedId || !graphDetail) return
    setSaving(true)
    try {
      const payload = {
        nodes: nodes.map((n) => ({
          id: n.id,
          label: (n.data.label as string) ?? "",
          nodeType: (n.data.nodeType as string) ?? "step",
          entityId: null,
          posX: n.position.x,
          posY: n.position.y,
          config: null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          label: typeof e.label === "string" ? e.label : null,
          condition: null,
        })),
      }
      const res = await fetch(`/api/ontology/process-graphs/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed to save"); return }
      toast.success("Graph saved")
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleSaveAsCopy() {
    if (!graphDetail) return
    setSaving(true)
    try {
      const createRes = await fetch("/api/ontology/process-graphs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${graphDetail.name} (Copy)`, description: graphDetail.description }),
      })
      const createData = await createRes.json()
      if (!createData.success) { toast.error(createData.message ?? "Failed"); return }

      const newId = createData.data.id
      const payload = {
        nodes: nodes.map((n) => ({
          id: n.id,
          label: (n.data.label as string) ?? "",
          nodeType: (n.data.nodeType as string) ?? "step",
          entityId: null,
          posX: n.position.x,
          posY: n.position.y,
          config: null,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          sourceNodeId: e.source,
          targetNodeId: e.target,
          label: typeof e.label === "string" ? e.label : null,
          condition: null,
        })),
      }
      const putRes = await fetch(`/api/ontology/process-graphs/${newId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const putData = await putRes.json()
      if (!putData.success) { toast.error(putData.message ?? "Failed to save copy"); return }

      toast.success("Saved as copy")
      await loadGraphs()
      setSelectedId(newId)
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  async function handleCreateGraph() {
    if (!newGraphName.trim()) { toast.error("Graph name required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/ontology/process-graphs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newGraphName }),
      })
      const data = await res.json()
      if (!data.success) { toast.error(data.message ?? "Failed"); return }
      toast.success("Graph created")
      setNewGraphName("")
      setShowNewGraph(false)
      await loadGraphs()
      setSelectedId(data.data.id)
    } catch { toast.error("Something went wrong") }
    finally { setSaving(false) }
  }

  function handleAddNode() {
    if (!newNode.label.trim()) { toast.error("Node label required"); return }
    const id = `node_${Date.now()}`
    const flowNode: Node = {
      id,
      position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
      data: { label: newNode.label, nodeType: newNode.nodeType },
      style: nodeStyleForType(newNode.nodeType),
    }
    setNodes((nds) => [...nds, flowNode])
    setNewNode({ label: "", nodeType: "step" })
    setShowAddNode(false)
  }

  const isSystem = graphDetail?.isSystem ?? false

  return (
    <div className="space-y-4" style={{ height: "calc(100vh - 6rem)" }}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="space-y-0">
          {loadingGraphs ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black min-w-48"
            >
              {graphs.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}{g.isSystem ? " (system)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        <Button size="sm" variant="outline" onClick={() => setShowNewGraph(!showNewGraph)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Graph
        </Button>

        <div className="flex-1" />

        {!isSystem && (
          <Button size="sm" variant="outline" onClick={() => setShowAddNode(!showAddNode)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Node
          </Button>
        )}

        {isSystem ? (
          <Button size="sm" onClick={handleSaveAsCopy} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
            Save as Copy
          </Button>
        ) : (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
        )}
      </div>

      {showNewGraph && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Graph Name</Label>
            <Input
              placeholder="e.g. Wet Granulation Process"
              value={newGraphName}
              onChange={(e) => setNewGraphName(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleCreateGraph} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Create
          </Button>
        </div>
      )}

      {showAddNode && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Node Label</Label>
            <Input
              placeholder="e.g. Mix Ingredients"
              value={newNode.label}
              onChange={(e) => setNewNode((p) => ({ ...p, label: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <select
              value={newNode.nodeType}
              onChange={(e) => setNewNode((p) => ({ ...p, nodeType: e.target.value }))}
              className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              {NODE_TYPES_LIST.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Button size="sm" onClick={handleAddNode}>Add</Button>
        </div>
      )}

      {isSystem && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-800">
          This is a system graph. Use &quot;Save as Copy&quot; to create an editable version.
        </div>
      )}

      <div className="flex-1 rounded-xl border border-gray-200 overflow-hidden bg-white" style={{ height: "60vh" }}>
        {loadingDetail ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !selectedId ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select or create a process graph
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isSystem ? undefined : onNodesChange}
            onEdgesChange={isSystem ? undefined : onEdgesChange}
            onConnect={isSystem ? undefined : onConnect}
            fitView
            nodesDraggable={!isSystem}
            nodesConnectable={!isSystem}
            elementsSelectable={!isSystem}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        )}
      </div>
    </div>
  )
}
