import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const updateOrgSchema = z.object({
  name: z.string().min(2).optional(),
  licenseNumber: z.string().optional(),
  address: z.string().optional(),
  gmpCertificateNumber: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const org = await prisma.organization.findUnique({
      where: { id: session.user.orgId },
    })

    if (!org) return errorResponse("Organization not found", 404)
    return successResponse(org)
  } catch (error) {
    console.error("[GET /api/organizations]", error)
    return errorResponse("Failed to fetch organization", 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    if (session.user.role !== "admin") {
      return errorResponse("Forbidden", 403)
    }

    const body = await request.json()
    const parsed = updateOrgSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const org = await prisma.organization.update({
      where: { id: session.user.orgId },
      data: parsed.data,
    })

    return successResponse(org)
  } catch (error) {
    console.error("[PATCH /api/organizations]", error)
    return errorResponse("Failed to update organization", 500)
  }
}
