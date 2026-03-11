import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get("entityId")

    const where: Record<string, unknown> = { orgId: session.user.orgId }
    if (entityId) where.entityId = entityId

    const lifecycles = await prisma.ontologyLifecycle.findMany({
      where,
      include: {
        entity: { select: { id: true, name: true, displayName: true } },
        states: { orderBy: { sortOrder: "asc" } },
        transitions: true,
      },
      orderBy: { createdAt: "asc" },
    })
    return successResponse(lifecycles)
  } catch (error) {
    console.error("[GET /api/ontology/lifecycles]", error)
    return errorResponse("Failed to fetch lifecycles", 500)
  }
}
