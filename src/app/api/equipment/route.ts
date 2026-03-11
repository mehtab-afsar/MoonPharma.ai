import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { getEquipment, createEquipment } from "@/server/services/equipment.server"
import { equipmentSchema } from "@/features/equipment/schemas/equipment.schema"
import type { EquipmentStatus } from "@/generated/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? undefined
    const type = searchParams.get("type") ?? undefined
    const status = (searchParams.get("status") ?? undefined) as EquipmentStatus | undefined

    const equipment = await getEquipment(session.user.orgId, search, type, status)
    return successResponse(equipment)
  } catch (error) {
    console.error("[GET /api/equipment]", error)
    return errorResponse("Failed to fetch equipment", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const parsed = equipmentSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { lastCalibrationDate, nextCalibrationDate, ...rest } = parsed.data

    const equipment = await createEquipment({
      orgId: session.user.orgId,
      userId: session.user.id,
      ...rest,
      lastCalibrationDate: lastCalibrationDate ? new Date(lastCalibrationDate) : undefined,
      nextCalibrationDate: nextCalibrationDate ? new Date(nextCalibrationDate) : undefined,
    })

    return successResponse(equipment, 201)
  } catch (error) {
    console.error("[POST /api/equipment]", error)
    return errorResponse("Failed to create equipment", 500)
  }
}
