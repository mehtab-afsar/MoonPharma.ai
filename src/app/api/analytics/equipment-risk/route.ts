import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"

export interface EquipmentRiskScore {
  equipmentId: string
  equipmentCode: string
  equipmentName: string
  oosCount: number
  deviationCount: number
  batchesUsedIn: number
  daysSinceCalibration: number | null
  isCalibrationOverdue: boolean
  riskScore: "high" | "medium" | "low"
  riskFactors: string[]
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const orgId = session.user.orgId
    const today = new Date()

    // Fetch all equipment for this org
    const equipment = await prisma.equipment.findMany({
      where: { orgId },
      select: {
        id: true,
        equipmentCode: true,
        equipmentName: true,
        equipmentType: true,
        nextCalibrationDate: true,
        status: true,
      },
    })

    const scores: EquipmentRiskScore[] = []

    for (const eq of equipment) {
      // Count OOS events associated with this equipment via batch steps
      const oosCount = await prisma.batchStepParameter.count({
        where: {
          isWithinLimit: false,
          batchStep: {
            equipmentId: eq.id,
            batch: { orgId },
          },
        },
      })

      const oosIPC = await prisma.batchIPCResult.count({
        where: {
          isWithinSpec: false,
          batchStep: {
            equipmentId: eq.id,
            batch: { orgId },
          },
        },
      })

      // Count deviations linked to batches where this equipment was used
      const batchesWithEquipment = await prisma.batchStep.findMany({
        where: { equipmentId: eq.id, batch: { orgId } },
        select: { batchId: true },
        distinct: ["batchId"],
      })
      const batchIds = batchesWithEquipment.map((b) => b.batchId)

      const deviationCount = await prisma.deviation.count({
        where: { orgId, batchId: { in: batchIds }, category: "equipment" },
      })

      const batchesUsedIn = batchIds.length

      // Calibration status
      let daysSinceCalibration: number | null = null
      let isCalibrationOverdue = false
      if (eq.nextCalibrationDate) {
        const msPerDay = 1000 * 60 * 60 * 24
        daysSinceCalibration = Math.floor(
          (today.getTime() - new Date(eq.nextCalibrationDate).getTime()) / msPerDay
        )
        isCalibrationOverdue = daysSinceCalibration > 0
      }

      // Risk scoring logic
      const riskFactors: string[] = []
      let riskPoints = 0

      if (oosCount + oosIPC >= 5) { riskPoints += 3; riskFactors.push(`${oosCount + oosIPC} OOS events`) }
      else if (oosCount + oosIPC >= 2) { riskPoints += 2; riskFactors.push(`${oosCount + oosIPC} OOS events`) }
      else if (oosCount + oosIPC >= 1) { riskPoints += 1; riskFactors.push(`${oosCount + oosIPC} OOS event`) }

      if (deviationCount >= 3) { riskPoints += 2; riskFactors.push(`${deviationCount} equipment deviations`) }
      else if (deviationCount >= 1) { riskPoints += 1; riskFactors.push(`${deviationCount} equipment deviation`) }

      if (isCalibrationOverdue) { riskPoints += 3; riskFactors.push(`Calibration overdue by ${Math.abs(daysSinceCalibration ?? 0)} days`) }
      else if (daysSinceCalibration !== null && daysSinceCalibration > -30) { riskPoints += 1; riskFactors.push("Calibration due within 30 days") }

      const riskScore: "high" | "medium" | "low" =
        riskPoints >= 4 ? "high" : riskPoints >= 2 ? "medium" : "low"

      scores.push({
        equipmentId: eq.id,
        equipmentCode: eq.equipmentCode,
        equipmentName: eq.equipmentName,
        oosCount: oosCount + oosIPC,
        deviationCount,
        batchesUsedIn,
        daysSinceCalibration,
        isCalibrationOverdue,
        riskScore,
        riskFactors,
      })
    }

    // Sort: high first, then medium, then low
    scores.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.riskScore] - order[b.riskScore]
    })

    return successResponse({ scores })
  } catch (error) {
    console.error("[GET /api/analytics/equipment-risk]", error)
    return errorResponse(
      error instanceof Error ? error.message : "Failed to calculate equipment risk scores",
      500
    )
  }
}
