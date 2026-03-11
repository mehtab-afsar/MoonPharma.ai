import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) return unauthorizedResponse()

  const config = await prisma.orgConfiguration.findUnique({ where: { orgId: session.user.orgId } })
  return successResponse({ rolePermissions: config?.rolePermissions ?? null })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) return unauthorizedResponse()
  if (session.user.role !== "admin") return errorResponse("Admin only", 403)

  const body = await req.json()
  if (!body.rolePermissions || typeof body.rolePermissions !== "object") {
    return errorResponse("Invalid role permissions")
  }

  const config = await prisma.orgConfiguration.update({
    where: { orgId: session.user.orgId },
    data: { rolePermissions: body.rolePermissions },
  })

  return successResponse({ rolePermissions: config.rolePermissions })
}
