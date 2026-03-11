import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { Prisma } from "@/generated/prisma"
import { z } from "zod"

const createConstraintSchema = z.object({
  entityId: z.string().uuid(),
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  constraintType: z.string().min(1),
  rule: z.record(z.string(), z.unknown()),
  severity: z.string().min(1),
  errorMessage: z.string().min(1),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get("entityId")

    const where: Record<string, unknown> = { orgId: session.user.orgId }
    if (entityId) where.entityId = entityId

    const constraints = await prisma.ontologyConstraint.findMany({
      where,
      include: {
        entity: { select: { id: true, name: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
    })
    return successResponse(constraints)
  } catch (error) {
    console.error("[GET /api/ontology/constraints]", error)
    return errorResponse("Failed to fetch constraints", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createConstraintSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    // Verify entity belongs to org
    const entity = await prisma.ontologyEntity.findFirst({
      where: { id: parsed.data.entityId, orgId: session.user.orgId, isActive: true },
    })
    if (!entity) return errorResponse("Entity not found", 404)

    const constraint = await prisma.ontologyConstraint.create({
      data: {
        orgId: session.user.orgId,
        entityId: parsed.data.entityId,
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        constraintType: parsed.data.constraintType,
        rule: parsed.data.rule as Prisma.InputJsonValue,
        severity: parsed.data.severity,
        errorMessage: parsed.data.errorMessage,
        isSystem: false,
        isActive: true,
      },
      include: {
        entity: { select: { id: true, name: true, displayName: true } },
      },
    })
    return successResponse(constraint, 201)
  } catch (error) {
    console.error("[POST /api/ontology/constraints]", error)
    return errorResponse("Failed to create constraint", 500)
  }
}
