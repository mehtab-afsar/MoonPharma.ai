import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { approveMBR, getMBRById } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const allowedRoles = ["qa_head", "production_head"]
    if (!allowedRoles.includes(session.user.role)) {
      return forbiddenResponse("Only QA Head or Production Head can approve MBRs")
    }

    const { mbrId } = await context.params

    const existing = await getMBRById(mbrId, session.user.orgId)
    if (!existing) return notFoundResponse("Master batch record not found")

    if (existing.status !== "pending_review") {
      return errorResponse("MBR must be in pending_review status to approve", 400)
    }

    const mbr = await approveMBR(mbrId, session.user.id, session.user.orgId)

    return successResponse(mbr)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/approve]", error)
    return errorResponse("Failed to approve master batch record", 500)
  }
}
