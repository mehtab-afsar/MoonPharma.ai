import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const createEntitySchema = z.object({
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const entities = await prisma.ontologyEntity.findMany({
      where: { orgId: session.user.orgId, isActive: true },
      orderBy: { sortOrder: "asc" },
    })
    return successResponse(entities)
  } catch (error) {
    console.error("[GET /api/ontology/entities]", error)
    return errorResponse("Failed to fetch entities", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createEntitySchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    const existing = await prisma.ontologyEntity.findUnique({
      where: { orgId_name: { orgId: session.user.orgId, name: parsed.data.name } },
    })
    if (existing) return errorResponse("Entity with this name already exists", 409)

    const entity = await prisma.ontologyEntity.create({
      data: {
        orgId: session.user.orgId,
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        description: parsed.data.description,
        icon: parsed.data.icon,
        sortOrder: parsed.data.sortOrder ?? 0,
        isSystem: false,
      },
    })
    return successResponse(entity, 201)
  } catch (error) {
    console.error("[POST /api/ontology/entities]", error)
    return errorResponse("Failed to create entity", 500)
  }
}
