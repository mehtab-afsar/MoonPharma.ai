import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/server/utils/api-response"
import { deleteMBRIPCCheck } from "@/server/services/mbr.server"

interface RouteContext {
  params: Promise<{ mbrId: string; stepId: string; ipcId: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { ipcId } = await context.params
    await deleteMBRIPCCheck(ipcId)

    return successResponse({ deleted: true })
  } catch (error) {
    console.error("[DELETE /api/mbr/[mbrId]/steps/[stepId]/ipc-checks/[ipcId]]", error)
    return errorResponse("Failed to delete IPC check", 500)
  }
}
