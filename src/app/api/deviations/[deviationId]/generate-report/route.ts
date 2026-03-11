import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getDeviationById } from "@/server/services/deviation.server"
import { generateDeviationReport } from "@/server/ai/report-generator"
import { prisma } from "@/server/db/prisma"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ deviationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { deviationId } = await params

    const deviation = await getDeviationById(deviationId, session.user.orgId)
    if (!deviation) return notFoundResponse("Deviation not found")

    // Enrich with product info
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

    const deviationData = {
      ...deviation,
      batch: {
        ...deviation.batch,
        mbr: batchWithProduct?.mbr,
      },
    }

    const report = await generateDeviationReport(deviationData)

    // Log to AIInteraction for compliance
    prisma.aIInteraction.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        batchId: deviation.batchId,
        interactionType: "deviation_analysis",
        prompt: `Deviation investigation report for ${deviation.deviationNumber}`,
        response: report,
        modelUsed: "anthropic/claude-opus-4-5",
      },
    }).catch((err) => console.error("[generate-report] AIInteraction log failed:", err))

    return successResponse({ report })
  } catch (error) {
    console.error("[POST /api/deviations/[id]/generate-report]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate report",
      500
    )
  }
}
