import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import {
  AuditAction,
  DeviationCategory,
  DeviationSeverity,
  DeviationStatus,
  DeviationType,
} from "@/generated/prisma"

// ============================================
// DEVIATION NUMBER GENERATION
// ============================================

async function generateDeviationNumber(orgId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.deviation.count({
    where: { orgId },
  })
  return `DEV-${year}-${String(count + 1).padStart(4, "0")}`
}

// ============================================
// DEVIATION QUERIES
// ============================================

export async function getDeviations(orgId: string, batchId?: string) {
  return prisma.deviation.findMany({
    where: {
      orgId,
      ...(batchId ? { batchId } : {}),
    },
    include: {
      raisedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
      approvedBy: { select: { fullName: true } },
      batch: { select: { batchNumber: true } },
      batchStep: { select: { stepName: true } },
    },
    orderBy: { raisedAt: "desc" },
  })
}

export async function getDeviationById(id: string, orgId: string) {
  return prisma.deviation.findFirst({
    where: { id, orgId },
    include: {
      raisedBy: { select: { fullName: true, employeeId: true } },
      resolvedBy: { select: { fullName: true, employeeId: true } },
      approvedBy: { select: { fullName: true, employeeId: true } },
      batch: { select: { batchNumber: true, id: true } },
      batchStep: { select: { stepName: true, stepNumber: true } },
    },
  })
}

// ============================================
// DEVIATION CREATION
// ============================================

export async function createDeviation(params: {
  orgId: string
  userId: string
  batchId: string
  batchStepId?: string
  deviationType: DeviationType
  category: DeviationCategory
  severity: DeviationSeverity
  description: string
  rootCause?: string
  impactAssessment?: string
}) {
  const deviationNumber = await generateDeviationNumber(params.orgId)

  const deviation = await prisma.deviation.create({
    data: {
      orgId: params.orgId,
      batchId: params.batchId,
      batchStepId: params.batchStepId,
      deviationNumber,
      deviationType: params.deviationType,
      category: params.category,
      severity: params.severity,
      description: params.description,
      rootCause: params.rootCause,
      impactAssessment: params.impactAssessment,
      status: DeviationStatus.open,
      raisedById: params.userId,
      raisedAt: new Date(),
    },
    include: {
      raisedBy: { select: { fullName: true } },
      batch: { select: { batchNumber: true } },
      batchStep: { select: { stepName: true } },
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "deviations",
    recordId: deviation.id,
    newValue: JSON.stringify({
      deviationNumber: deviation.deviationNumber,
      severity: deviation.severity,
      status: deviation.status,
    }),
  })

  return deviation
}

// ============================================
// DEVIATION UPDATES
// ============================================

export async function updateDeviation(params: {
  id: string
  orgId: string
  userId: string
  rootCause?: string
  impactAssessment?: string
  correctiveAction?: string
  preventiveAction?: string
  status?: DeviationStatus
}) {
  const existing = await prisma.deviation.findFirst({
    where: { id: params.id, orgId: params.orgId },
  })
  if (!existing) throw new Error("Deviation not found")

  const deviation = await prisma.deviation.update({
    where: { id: params.id },
    data: {
      ...(params.rootCause !== undefined ? { rootCause: params.rootCause } : {}),
      ...(params.impactAssessment !== undefined
        ? { impactAssessment: params.impactAssessment }
        : {}),
      ...(params.correctiveAction !== undefined
        ? { correctiveAction: params.correctiveAction }
        : {}),
      ...(params.preventiveAction !== undefined
        ? { preventiveAction: params.preventiveAction }
        : {}),
      ...(params.status !== undefined ? { status: params.status } : {}),
    },
    include: {
      raisedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
      batch: { select: { batchNumber: true } },
      batchStep: { select: { stepName: true } },
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "deviations",
    recordId: params.id,
    oldValue: JSON.stringify({ status: existing.status }),
    newValue: JSON.stringify({
      status: params.status ?? existing.status,
      rootCause: params.rootCause,
      correctiveAction: params.correctiveAction,
      preventiveAction: params.preventiveAction,
    }),
  })

  return deviation
}

// ============================================
// DEVIATION CLOSE
// ============================================

export async function closeDeviation(id: string, orgId: string, userId: string) {
  const existing = await prisma.deviation.findFirst({
    where: { id, orgId },
  })
  if (!existing) throw new Error("Deviation not found")
  if (existing.status === DeviationStatus.closed) {
    throw new Error("Deviation is already closed")
  }

  const deviation = await prisma.deviation.update({
    where: { id },
    data: {
      status: DeviationStatus.closed,
      resolvedById: userId,
      resolvedAt: new Date(),
    },
    include: {
      raisedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
      batch: { select: { batchNumber: true } },
      batchStep: { select: { stepName: true } },
    },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "deviations",
    recordId: id,
    fieldName: "status",
    oldValue: existing.status,
    newValue: DeviationStatus.closed,
  })

  return deviation
}

export type { DeviationType, DeviationCategory, DeviationSeverity, DeviationStatus }
