import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getMBRById } from "@/server/services/mbr.server"
import { prisma } from "@/server/db/prisma"
import type { MBRStatus } from "@/generated/prisma"

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

    return successResponse(mbr)
  } catch (error) {
    console.error("[GET /api/mbr/[mbrId]]", error)
    return errorResponse("Failed to fetch master batch record", 500)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params
    const body = await request.json()
    const { status } = body as { status?: MBRStatus }

    if (!status) {
      return errorResponse("Missing required field: status", 400)
    }

    const existing = await getMBRById(mbrId, session.user.orgId)
    if (!existing) return notFoundResponse("Master batch record not found")

    const updated = await prisma.masterBatchRecord.update({
      where: { id: mbrId },
      data: { status },
    })

    return successResponse(updated)
  } catch (error) {
    console.error("[PUT /api/mbr/[mbrId]]", error)
    return errorResponse("Failed to update master batch record", 500)
  }
}
