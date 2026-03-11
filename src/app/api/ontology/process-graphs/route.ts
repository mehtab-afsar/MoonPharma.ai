import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const createGraphSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const graphs = await prisma.processGraph.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { createdAt: "asc" },
    })
    return successResponse(graphs)
  } catch (error) {
    console.error("[GET /api/ontology/process-graphs]", error)
    return errorResponse("Failed to fetch process graphs", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createGraphSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    const graph = await prisma.processGraph.create({
      data: {
        orgId: session.user.orgId,
        name: parsed.data.name,
        description: parsed.data.description,
        isSystem: false,
      },
    })
    return successResponse(graph, 201)
  } catch (error) {
    console.error("[POST /api/ontology/process-graphs]", error)
    return errorResponse("Failed to create process graph", 500)
  }
}
