import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/server/db/prisma"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"

// POST — add a step to a process template
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Admin only", 403)

    const { id } = await params
    const template = await prisma.processTemplate.findFirst({
      where: { id, orgId: session.user.orgId },
      include: { steps: { select: { stepNumber: true } } },
    })
    if (!template) return errorResponse("Template not found", 404)

    const body = await request.json()
    const {
      stepName,
      stage,
      instructions,
      equipmentType,
      estimatedDurationMinutes,
      requiresLineClearance,
      requiresEnvironmentalCheck,
      envTempMin,
      envTempMax,
      envHumidityMin,
      envHumidityMax,
      parameters = [],
      ipcChecks = [],
    } = body

    if (!stepName || !instructions) {
      return errorResponse("stepName and instructions are required", 400)
    }

    const nextStepNumber = template.steps.length > 0
      ? Math.max(...template.steps.map((s) => s.stepNumber)) + 1
      : 1

    const step = await prisma.stepTemplate.create({
      data: {
        processTemplateId: id,
        orgId: session.user.orgId,
        stepNumber: nextStepNumber,
        stepName,
        stage,
        instructions,
        equipmentType,
        estimatedDurationMinutes,
        requiresLineClearance: requiresLineClearance ?? false,
        requiresEnvironmentalCheck: requiresEnvironmentalCheck ?? false,
        envTempMin,
        envTempMax,
        envHumidityMin,
        envHumidityMax,
        parameters: {
          create: parameters.map((p: Record<string, unknown>, i: number) => ({
            parameterName: p.parameterName,
            parameterType: p.parameterType ?? "numeric",
            unit: p.unit,
            targetValue: p.targetValue,
            minValue: p.minValue,
            maxValue: p.maxValue,
            isCritical: p.isCritical ?? false,
            sequenceOrder: i,
          })),
        },
        ipcChecks: {
          create: ipcChecks.map((c: Record<string, unknown>, i: number) => ({
            checkName: c.checkName,
            checkType: c.checkType ?? "numeric",
            unit: c.unit,
            specification: c.specification,
            targetValue: c.targetValue,
            minValue: c.minValue,
            maxValue: c.maxValue,
            frequency: c.frequency,
            sampleSize: c.sampleSize,
            isCritical: c.isCritical ?? false,
            sequenceOrder: i,
          })),
        },
      },
      include: {
        parameters: { orderBy: { sequenceOrder: "asc" } },
        ipcChecks: { orderBy: { sequenceOrder: "asc" } },
      },
    })

    return successResponse(step, 201)
  } catch (error) {
    console.error("[POST /api/process-templates/[id]/steps]", error)
    return errorResponse("Failed to add step", 500)
  }
}
