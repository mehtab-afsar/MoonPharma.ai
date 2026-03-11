import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getMBRById } from "@/server/services/mbr.server"
import { generateMBRStep } from "@/server/ai/mbr-assistant"
import { prisma } from "@/server/db/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mbrId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { mbrId } = await params

    const mbr = await getMBRById(mbrId, session.user.orgId)
    if (!mbr) return notFoundResponse("MBR not found")

    const body = await request.json()
    const description: string = body.description ?? ""
    const existingStepCount: number = body.existingStepCount ?? 0

    if (!description.trim()) {
      return errorResponse("Description is required", 400)
    }

    const step = await generateMBRStep({
      description,
      productName: mbr.product?.productName,
      dosageForm: mbr.product?.dosageForm,
      existingStepCount,
    })

    // Log to AIInteraction for compliance
    prisma.aIInteraction.create({
      data: {
        orgId: session.user.orgId,
        userId: session.user.id,
        interactionType: "query",
        prompt: `MBR step generation for MBR ${mbr.mbrCode}: "${description}"`,
        response: JSON.stringify(step),
        modelUsed: "anthropic/claude-opus-4-5",
      },
    }).catch((err) => console.error("[ai-generate] AIInteraction log failed:", err))

    return successResponse({ step })
  } catch (error) {
    console.error("[POST /api/mbr/[id]/steps/ai-generate]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to generate step",
      500
    )
  }
}
