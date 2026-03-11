import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { AttributeDataType } from "@/generated/prisma"
import { z } from "zod"

const createAttributeSchema = z.object({
  entityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  dataType: z.nativeEnum(AttributeDataType),
  description: z.string().optional(),
  isRequired: z.boolean().optional(),
  enumOptions: z.array(z.string()).optional(),
  sortOrder: z.number().int().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get("entityId")
    if (!entityId) return errorResponse("entityId query param required", 400)

    const attributes = await prisma.ontologyAttribute.findMany({
      where: { entityId, orgId: session.user.orgId },
      orderBy: { sortOrder: "asc" },
    })
    return successResponse(attributes)
  } catch (error) {
    console.error("[GET /api/ontology/attributes]", error)
    return errorResponse("Failed to fetch attributes", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createAttributeSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    // Verify entity belongs to org
    const entity = await prisma.ontologyEntity.findFirst({
      where: { id: parsed.data.entityId, orgId: session.user.orgId, isActive: true },
    })
    if (!entity) return errorResponse("Entity not found", 404)

    // Check unique name within entity
    const existing = await prisma.ontologyAttribute.findUnique({
      where: { entityId_name: { entityId: parsed.data.entityId, name: parsed.data.name } },
    })
    if (existing) return errorResponse("Attribute with this name already exists in this entity", 409)

    const attribute = await prisma.ontologyAttribute.create({
      data: {
        entityId: parsed.data.entityId,
        orgId: session.user.orgId,
        name: parsed.data.name,
        displayName: parsed.data.displayName,
        dataType: parsed.data.dataType,
        description: parsed.data.description,
        isRequired: parsed.data.isRequired ?? false,
        enumOptions: parsed.data.enumOptions ?? undefined,
        sortOrder: parsed.data.sortOrder ?? 0,
        isSystem: false,
      },
    })
    return successResponse(attribute, 201)
  } catch (error) {
    console.error("[POST /api/ontology/attributes]", error)
    return errorResponse("Failed to create attribute", 500)
  }
}
