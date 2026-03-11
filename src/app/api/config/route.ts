import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { NumberingReset, ESignatureMethod } from "@/generated/prisma"
import { z } from "zod"

const configSchema = z.object({
  batchPrefix: z.string().min(1).max(10).optional(),
  batchNumberReset: z.nativeEnum(NumberingReset).optional(),
  deviationPrefix: z.string().min(1).max(10).optional(),
  changeControlPrefix: z.string().min(1).max(10).optional(),
  qaReviewStages: z.number().int().min(2).max(3).optional(),
  requireLineClearance: z.boolean().optional(),
  autoDeviationOnOos: z.boolean().optional(),
  criticalDeviationHold: z.boolean().optional(),
  eSignatureMethod: z.nativeEnum(ESignatureMethod).optional(),
  sessionTimeoutMinutes: z.number().int().min(5).max(1440).optional(),
  failedLoginLockout: z.number().int().min(1).max(20).optional(),
  defaultYieldMin: z.number().min(0).max(100).optional(),
  defaultYieldMax: z.number().min(0).max(120).optional(),
  defaultMaterialTolerance: z.number().min(0).max(50).optional(),
})

async function getOrCreateConfig(orgId: string) {
  const existing = await prisma.orgConfiguration.findUnique({ where: { orgId } })
  if (existing) return existing
  return prisma.orgConfiguration.create({ data: { orgId } })
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const config = await getOrCreateConfig(session.user.orgId)
    return successResponse(config)
  } catch (error) {
    console.error("[GET /api/config]", error)
    return errorResponse("Failed to fetch configuration", 500)
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = configSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const config = await prisma.orgConfiguration.upsert({
      where: { orgId: session.user.orgId },
      create: { orgId: session.user.orgId, ...parsed.data },
      update: parsed.data,
    })

    return successResponse(config)
  } catch (error) {
    console.error("[PUT /api/config]", error)
    return errorResponse("Failed to update configuration", 500)
  }
}
