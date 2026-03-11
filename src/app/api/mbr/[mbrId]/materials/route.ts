import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getMBRById, addMBRMaterial } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params
    const mbr = await getMBRById(mbrId, session.user.orgId)

    if (!mbr) return notFoundResponse("Master batch record not found")

    return successResponse(mbr.materials)
  } catch (error) {
    console.error("[GET /api/mbr/[mbrId]/materials]", error)
    return errorResponse("Failed to fetch MBR materials", 500)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params

    const existing = await getMBRById(mbrId, session.user.orgId)
    if (!existing) return notFoundResponse("Master batch record not found")

    const body = await request.json()
    const {
      materialId,
      quantity,
      unit,
      tolerancePlus,
      toleranceMinus,
      stage,
      sequenceOrder,
      isCritical,
      instructions,
    } = body

    if (!materialId || quantity === undefined || !unit || sequenceOrder === undefined) {
      return errorResponse("Missing required fields: materialId, quantity, unit, sequenceOrder", 400)
    }

    const material = await addMBRMaterial({
      mbrId,
      materialId,
      quantity: Number(quantity),
      unit,
      tolerancePlus: tolerancePlus ? Number(tolerancePlus) : undefined,
      toleranceMinus: toleranceMinus ? Number(toleranceMinus) : undefined,
      stage,
      sequenceOrder: Number(sequenceOrder),
      isCritical: Boolean(isCritical),
      instructions,
    })

    return successResponse(material, 201)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/materials]", error)
    return errorResponse("Failed to add MBR material", 500)
  }
}
