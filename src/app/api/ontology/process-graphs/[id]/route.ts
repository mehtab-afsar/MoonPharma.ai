import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { ProcessNodeType, Prisma } from "@/generated/prisma"
import { z } from "zod"

const nodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  nodeType: z.nativeEnum(ProcessNodeType),
  entityId: z.string().nullable().optional(),
  posX: z.number(),
  posY: z.number(),
  config: z.record(z.string(), z.unknown()).nullable().optional(),
})

const edgeSchema = z.object({
  id: z.string(),
  sourceNodeId: z.string(),
  targetNodeId: z.string(),
  label: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
})

const putGraphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { id } = await params
    const graph = await prisma.processGraph.findFirst({
      where: { id, orgId: session.user.orgId },
      include: {
        nodes: true,
        edges: true,
      },
    })
    if (!graph) return notFoundResponse("Process graph not found")
    return successResponse(graph)
  } catch (error) {
    console.error("[GET /api/ontology/process-graphs/[id]]", error)
    return errorResponse("Failed to fetch process graph", 500)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const graph = await prisma.processGraph.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!graph) return notFoundResponse("Process graph not found")

    const body = await request.json()
    const parsed = putGraphSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    // Delete all existing nodes and edges, then recreate
    await prisma.$transaction(async (tx) => {
      await tx.processGraphEdge.deleteMany({ where: { graphId: id } })
      await tx.processGraphNode.deleteMany({ where: { graphId: id } })

      if (parsed.data.nodes.length > 0) {
        await tx.processGraphNode.createMany({
          data: parsed.data.nodes.map((n) => ({
            id: n.id,
            graphId: id,
            orgId: session.user.orgId,
            label: n.label,
            nodeType: n.nodeType,
            entityId: n.entityId ?? null,
            posX: n.posX,
            posY: n.posY,
            config: (n.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          })),
        })
      }

      if (parsed.data.edges.length > 0) {
        await tx.processGraphEdge.createMany({
          data: parsed.data.edges.map((e) => ({
            id: e.id,
            graphId: id,
            sourceNodeId: e.sourceNodeId,
            targetNodeId: e.targetNodeId,
            label: e.label ?? null,
            condition: e.condition ?? null,
          })),
        })
      }

      await tx.processGraph.update({ where: { id }, data: { updatedAt: new Date() } })
    })

    const updated = await prisma.processGraph.findFirst({
      where: { id },
      include: { nodes: true, edges: true },
    })
    return successResponse(updated)
  } catch (error) {
    console.error("[PUT /api/ontology/process-graphs/[id]]", error)
    return errorResponse("Failed to update process graph", 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const graph = await prisma.processGraph.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!graph) return notFoundResponse("Process graph not found")
    if (graph.isSystem) return errorResponse("Cannot delete system process graphs", 403)

    await prisma.processGraph.delete({ where: { id } })
    return successResponse({ id })
  } catch (error) {
    console.error("[DELETE /api/ontology/process-graphs/[id]]", error)
    return errorResponse("Failed to delete process graph", 500)
  }
}
