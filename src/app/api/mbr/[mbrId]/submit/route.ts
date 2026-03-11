import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { submitMBRForReview, getMBRById } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await context.params

    const existing = await getMBRById(mbrId, session.user.orgId)
    if (!existing) return notFoundResponse("Master batch record not found")

    if (existing.status !== "draft") {
      return errorResponse("MBR must be in draft status to submit for review", 400)
    }

    const mbr = await submitMBRForReview(mbrId, session.user.id, session.user.orgId)

    return successResponse(mbr)
  } catch (error) {
    console.error("[POST /api/mbr/[mbrId]/submit]", error)
    return errorResponse("Failed to submit master batch record for review", 500)
  }
}
