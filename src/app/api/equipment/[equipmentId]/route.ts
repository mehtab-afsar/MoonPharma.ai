import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getEquipmentById, updateEquipmentStatus } from "@/server/services/equipment.server"
import type { EquipmentStatus } from "@/generated/prisma"

interface RouteContext {
  params: Promise<{ equipmentId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { equipmentId } = await context.params
    const equipment = await getEquipmentById(equipmentId, session.user.orgId)

    if (!equipment) return notFoundResponse("Equipment not found")

    return successResponse(equipment)
  } catch (error) {
    console.error("[GET /api/equipment/[equipmentId]]", error)
    return errorResponse("Failed to fetch equipment", 500)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { equipmentId } = await context.params
    const body = await request.json()
    const { status } = body as { status: EquipmentStatus }

    if (!status) {
      return errorResponse("Status is required", 400)
    }

    const validStatuses: EquipmentStatus[] = ["available", "in_use", "maintenance", "retired"]
    if (!validStatuses.includes(status)) {
      return errorResponse("Invalid equipment status", 400)
    }

    const equipment = await updateEquipmentStatus(
      equipmentId,
      session.user.orgId,
      session.user.id,
      status
    )

    return successResponse(equipment)
  } catch (error) {
    console.error("[PUT /api/equipment/[equipmentId]]", error)
    if (error instanceof Error && error.message === "Equipment not found") {
      return notFoundResponse("Equipment not found")
    }
    return errorResponse("Failed to update equipment status", 500)
  }
}
