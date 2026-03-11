import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { RelationshipType } from "@/generated/prisma"
import { z } from "zod"

const createRelSchema = z.object({
  sourceEntityId: z.string().uuid(),
  targetEntityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  relationshipType: z.nativeEnum(RelationshipType),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const relationships = await prisma.ontologyRelationship.findMany({
      where: { orgId: session.user.orgId },
      include: {
        sourceEntity: { select: { id: true, name: true, displayName: true, icon: true } },
        targetEntity: { select: { id: true, name: true, displayName: true, icon: true } },
      },
      orderBy: { createdAt: "asc" },
    })
    return successResponse(relationships)
  } catch (error) {
    console.error("[GET /api/ontology/relationships]", error)
    return errorResponse("Failed to fetch relationships", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createRelSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    // Verify both entities belong to org
    const [source, target] = await Promise.all([
      prisma.ontologyEntity.findFirst({ where: { id: parsed.data.sourceEntityId, orgId: session.user.orgId, isActive: true } }),
      prisma.ontologyEntity.findFirst({ where: { id: parsed.data.targetEntityId, orgId: session.user.orgId, isActive: true } }),
    ])
    if (!source) return errorResponse("Source entity not found", 404)
    if (!target) return errorResponse("Target entity not found", 404)

    const relationship = await prisma.ontologyRelationship.create({
      data: {
        orgId: session.user.orgId,
        sourceEntityId: parsed.data.sourceEntityId,
        targetEntityId: parsed.data.targetEntityId,
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        relationshipType: parsed.data.relationshipType,
        description: parsed.data.description,
        isSystem: false,
      },
      include: {
        sourceEntity: { select: { id: true, name: true, displayName: true, icon: true } },
        targetEntity: { select: { id: true, name: true, displayName: true, icon: true } },
      },
    })
    return successResponse(relationship, 201)
  } catch (error) {
    console.error("[POST /api/ontology/relationships]", error)
    return errorResponse("Failed to create relationship", 500)
  }
}
