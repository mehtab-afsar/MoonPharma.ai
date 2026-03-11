import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { deleteMBRParameter } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string; stepId: string; parameterId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { parameterId } = await context.params
    await deleteMBRParameter(parameterId)

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/mbr/[mbrId]/steps/[stepId]/parameters/[parameterId]]", error)
    return errorResponse("Failed to delete process parameter", 500)
  }
}
