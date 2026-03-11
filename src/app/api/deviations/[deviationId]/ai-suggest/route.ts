import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getDeviationById } from "@/server/services/deviation.server"
import { suggestDeviationRCA } from "@/server/ai/deviation-analyzer"
import { prisma } from "@/server/db/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ deviationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { deviationId } = await params

    // Fetch the deviation with batch/step context
    const deviation = await getDeviationById(deviationId, session.user.orgId)
    if (!deviation) return notFoundResponse("Deviation not found")

    // Fetch product info via batch → MBR → product
    const batchWithProduct = await prisma.batch.findFirst({
      where: { id: deviation.batchId },
      include: {
        mbr: {
          include: {
            product: { select: { productName: true, strength: true, dosageForm: true } },
          },
        },
      },
    })

    // Fetch historical deviations for same product to identify patterns
    const historicalDeviations = batchWithProduct?.mbr?.product
      ? await prisma.deviation.findMany({
          where: {
            orgId: session.user.orgId,
            id: { not: deviationId },
            batch: {
              mbr: {
                productId: batchWithProduct.mbr.productId,
              },
            },
          },
          select: {
            deviationNumber: true,
            severity: true,
            description: true,
            rootCause: true,
            correctiveAction: true,
          },
          orderBy: { raisedAt: "desc" },
          take: 10,
        })
      : []

    const deviationData = {
      ...deviation,
      batch: {
        ...deviation.batch,
        mbr: batchWithProduct?.mbr,
      },
      historicalDeviations,
    }

    const suggestion = await suggestDeviationRCA(deviationData)

    // Log AI interaction for compliance
    await prisma.aIInteraction.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        batchId: deviation.batchId,
        interactionType: "deviation_analysis",
        prompt: `Deviation RCA suggestion for ${deviation.deviationNumber}`,
        response: JSON.stringify(suggestion),
        modelUsed: "anthropic/claude-sonnet-4-5",
      },
    })

    return successResponse({ suggestion })
  } catch (error) {
    console.error("[POST /api/deviations/[id]/ai-suggest]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate AI suggestion",
      500
    )
  }
}
