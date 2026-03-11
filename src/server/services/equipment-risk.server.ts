// Server-side equipment risk scoring — uses batch OOS/deviation data to assess equipment risk
import { prisma } from "@/server/db/prisma"

export interface EquipmentRisk {
  equipmentId: string
  riskScore: "high" | "medium" | "low"
  riskFactors: string[]
  oosCount: number
  deviationCount: number
}

export async function getEquipmentRiskScores(orgId: string): Promise<Map<string, EquipmentRisk>> {
  const today = new Date()
  const riskMap = new Map<string, EquipmentRisk>()

  // Get all batch steps grouped by equipment for this org
  const stepsWithEquipment = await prisma.batchStep.findMany({
    where: { equipmentId: { not: null }, batch: { orgId } },
    select: {
      id: true,
      batchId: true,
      equipmentId: true,
      parameters: { select: { isWithinLimit: true } },
      ipcResults: { select: { isWithinSpec: true } },
    },
  })

  // Get all equipment deviations for this org
  const equipmentDeviations = await prisma.deviation.groupBy({
    by: ["batchId"],
    where: { orgId, category: "equipment" },
    _count: { id: true },
  })
  const deviationByBatch = new Map(equipmentDeviations.map((d) => [d.batchId, d._count.id]))

  // Get equipment calibration dates
  const equipment = await prisma.equipment.findMany({
    where: { orgId },
    select: { id: true, nextCalibrationDate: true },
  })
  const calibrationMap = new Map(equipment.map((e) => [e.id, e.nextCalibrationDate]))

  // Aggregate per equipment
  const eqMap = new Map<string, { oosCount: number; batchIds: Set<string> }>()

  for (const step of stepsWithEquipment) {
    if (!step.equipmentId) continue
    if (!eqMap.has(step.equipmentId)) {
      eqMap.set(step.equipmentId, { oosCount: 0, batchIds: new Set() })
    }
    const entry = eqMap.get(step.equipmentId)!
    entry.batchIds.add(step.batchId)
    for (const p of step.parameters) {
      if (p.isWithinLimit === false) entry.oosCount++
    }
    for (const r of step.ipcResults) {
      if (r.isWithinSpec === false) entry.oosCount++
    }
  }

  // Calculate risk per equipment
  for (const [eqId, data] of eqMap.entries()) {
    const riskFactors: string[] = []
    let riskPoints = 0

    // OOS count
    if (data.oosCount >= 5) { riskPoints += 3; riskFactors.push(`${data.oosCount} OOS events`) }
    else if (data.oosCount >= 2) { riskPoints += 2; riskFactors.push(`${data.oosCount} OOS events`) }
    else if (data.oosCount >= 1) { riskPoints += 1; riskFactors.push(`${data.oosCount} OOS event`) }

    // Equipment deviations (aggregate from batches this equipment was used in)
    let deviationCount = 0
    for (const batchId of data.batchIds) {
      deviationCount += deviationByBatch.get(batchId) ?? 0
    }
    if (deviationCount >= 3) { riskPoints += 2; riskFactors.push(`${deviationCount} equipment deviations`) }
    else if (deviationCount >= 1) { riskPoints += 1; riskFactors.push(`${deviationCount} equipment deviation`) }

    // Calibration status
    const nextCalib = calibrationMap.get(eqId)
    if (nextCalib) {
      const daysUntil = Math.floor((new Date(nextCalib).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntil < 0) {
        riskPoints += 3
        riskFactors.push(`Calibration overdue by ${Math.abs(daysUntil)} days`)
      } else if (daysUntil <= 30) {
        riskPoints += 1
        riskFactors.push(`Calibration due in ${daysUntil} days`)
      }
    }

    const riskScore: "high" | "medium" | "low" =
      riskPoints >= 4 ? "high" : riskPoints >= 2 ? "medium" : "low"

    riskMap.set(eqId, {
      equipmentId: eqId,
      riskScore,
      riskFactors,
      oosCount: data.oosCount,
      deviationCount,
    })
  }

  return riskMap
}
