import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction, MBRStatus, type ParameterType, type CheckType } from "@/generated/prisma"

// ============================================
// MBR CRUD
// ============================================

export async function getMBRs(orgId: string, productId?: string) {
  return prisma.masterBatchRecord.findMany({
    where: {
      orgId,
      ...(productId ? { productId } : {}),
    },
    include: {
      product: { select: { productName: true, strength: true, dosageForm: true } },
      createdBy: { select: { fullName: true } },
      approvedBy: { select: { fullName: true } },
      _count: { select: { batches: true, steps: true } },
    },
    orderBy: [{ mbrCode: "asc" }, { version: "desc" }],
  })
}

export async function getMBRById(id: string, orgId: string) {
  return prisma.masterBatchRecord.findFirst({
    where: { id, orgId },
    include: {
      product: true,
      createdBy: { select: { id: true, fullName: true, designation: true } },
      approvedBy: { select: { id: true, fullName: true, designation: true } },
      materials: {
        include: { material: true },
        orderBy: { sequenceOrder: "asc" },
      },
      steps: {
        include: {
          parameters: { orderBy: { sequenceOrder: "asc" } },
          ipcChecks: { orderBy: { sequenceOrder: "asc" } },
        },
        orderBy: { stepNumber: "asc" },
      },
    },
  })
}

interface CreateMBRParams {
  orgId: string
  userId: string
  productId: string
  mbrCode: string
  batchSizeValue: number
  batchSizeUnit: string
  theoreticalYieldValue?: number
  theoreticalYieldUnit?: string
  yieldLimitMin?: number
  yieldLimitMax?: number
  effectiveDate?: Date
  reviewDate?: Date
}

export async function createMBR(params: CreateMBRParams) {
  // Check for existing MBR code to determine version
  const existingCount = await prisma.masterBatchRecord.count({
    where: { orgId: params.orgId, mbrCode: params.mbrCode },
  })

  const mbr = await prisma.masterBatchRecord.create({
    data: {
      orgId: params.orgId,
      productId: params.productId,
      mbrCode: params.mbrCode,
      version: existingCount + 1,
      batchSizeValue: params.batchSizeValue,
      batchSizeUnit: params.batchSizeUnit,
      theoreticalYieldValue: params.theoreticalYieldValue,
      theoreticalYieldUnit: params.theoreticalYieldUnit,
      yieldLimitMin: params.yieldLimitMin ?? 95,
      yieldLimitMax: params.yieldLimitMax ?? 100,
      effectiveDate: params.effectiveDate,
      reviewDate: params.reviewDate,
      createdById: params.userId,
      status: MBRStatus.draft,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "master_batch_records",
    recordId: mbr.id,
    newValue: JSON.stringify({ mbrCode: mbr.mbrCode, version: mbr.version }),
  })

  return mbr
}

// ============================================
// MBR MATERIALS
// ============================================

interface AddMBRMaterialParams {
  mbrId: string
  materialId: string
  quantity: number
  unit: string
  tolerancePlus?: number
  toleranceMinus?: number
  stage?: string
  sequenceOrder: number
  isCritical?: boolean
  instructions?: string
}

export async function addMBRMaterial(params: AddMBRMaterialParams) {
  return prisma.mBRMaterial.create({
    data: {
      mbrId: params.mbrId,
      materialId: params.materialId,
      quantity: params.quantity,
      unit: params.unit,
      tolerancePlus: params.tolerancePlus,
      toleranceMinus: params.toleranceMinus,
      stage: params.stage,
      sequenceOrder: params.sequenceOrder,
      isCritical: params.isCritical ?? false,
      instructions: params.instructions,
    },
    include: { material: true },
  })
}

export async function updateMBRMaterial(id: string, data: Partial<AddMBRMaterialParams>) {
  return prisma.mBRMaterial.update({
    where: { id },
    data: {
      quantity: data.quantity,
      unit: data.unit,
      tolerancePlus: data.tolerancePlus,
      toleranceMinus: data.toleranceMinus,
      stage: data.stage,
      isCritical: data.isCritical,
      instructions: data.instructions,
    },
    include: { material: true },
  })
}

export async function deleteMBRMaterial(id: string) {
  return prisma.mBRMaterial.delete({ where: { id } })
}

// ============================================
// MBR STEPS
// ============================================

interface BulkParameter {
  parameterName: string
  parameterType: ParameterType
  unit?: string
  targetValue?: string
  minValue?: number
  maxValue?: number
  isCritical?: boolean
  sequenceOrder: number
}

interface BulkIPC {
  checkName: string
  checkType: CheckType
  unit?: string
  specification?: string
  targetValue?: number
  minValue?: number
  maxValue?: number
  frequency?: string
  sampleSize?: string
  isCritical?: boolean
  sequenceOrder: number
}

interface AddMBRStepParams {
  mbrId: string
  stepNumber: number
  stepName: string
  stage?: string
  instructions: string
  equipmentType?: string
  estimatedDurationMinutes?: number
  requiresLineClearance?: boolean
  requiresEnvironmentalCheck?: boolean
  envTempMin?: number
  envTempMax?: number
  envHumidityMin?: number
  envHumidityMax?: number
  // Optional bulk-create when importing from process templates
  parameters?: BulkParameter[]
  ipcChecks?: BulkIPC[]
}

export async function addMBRStep(params: AddMBRStepParams) {
  return prisma.mBRStep.create({
    data: {
      mbrId: params.mbrId,
      stepNumber: params.stepNumber,
      stepName: params.stepName,
      stage: params.stage,
      instructions: params.instructions,
      equipmentType: params.equipmentType,
      estimatedDurationMinutes: params.estimatedDurationMinutes,
      requiresLineClearance: params.requiresLineClearance ?? false,
      requiresEnvironmentalCheck: params.requiresEnvironmentalCheck ?? false,
      envTempMin: params.envTempMin,
      envTempMax: params.envTempMax,
      envHumidityMin: params.envHumidityMin,
      envHumidityMax: params.envHumidityMax,
      ...(params.parameters && params.parameters.length > 0
        ? {
            parameters: {
              create: params.parameters.map((p) => ({
                parameterName: p.parameterName,
                parameterType: p.parameterType,
                unit: p.unit,
                targetValue: p.targetValue,
                minValue: p.minValue,
                maxValue: p.maxValue,
                isCritical: p.isCritical ?? false,
                sequenceOrder: p.sequenceOrder,
              })),
            },
          }
        : {}),
      ...(params.ipcChecks && params.ipcChecks.length > 0
        ? {
            ipcChecks: {
              create: params.ipcChecks.map((c) => ({
                checkName: c.checkName,
                checkType: c.checkType,
                unit: c.unit,
                specification: c.specification,
                targetValue: c.targetValue,
                minValue: c.minValue,
                maxValue: c.maxValue,
                frequency: c.frequency,
                sampleSize: c.sampleSize,
                isCritical: c.isCritical ?? false,
                sequenceOrder: c.sequenceOrder,
              })),
            },
          }
        : {}),
    },
    include: {
      parameters: { orderBy: { sequenceOrder: "asc" } },
      ipcChecks: { orderBy: { sequenceOrder: "asc" } },
    },
  })
}

export async function updateMBRStep(id: string, data: Partial<AddMBRStepParams>) {
  return prisma.mBRStep.update({
    where: { id },
    data: {
      stepName: data.stepName,
      stage: data.stage,
      instructions: data.instructions,
      equipmentType: data.equipmentType,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      requiresLineClearance: data.requiresLineClearance,
      requiresEnvironmentalCheck: data.requiresEnvironmentalCheck,
      envTempMin: data.envTempMin,
      envTempMax: data.envTempMax,
      envHumidityMin: data.envHumidityMin,
      envHumidityMax: data.envHumidityMax,
    },
    include: { parameters: true, ipcChecks: true },
  })
}

export async function deleteMBRStep(id: string) {
  return prisma.mBRStep.delete({ where: { id } })
}

// ============================================
// MBR STEP PARAMETERS
// ============================================

interface AddMBRParameterParams {
  mbrStepId: string
  parameterName: string
  parameterType: ParameterType
  unit?: string
  targetValue?: string
  minValue?: number
  maxValue?: number
  selectionOptions?: string[]
  isCritical?: boolean
  sequenceOrder: number
}

export async function addMBRParameter(params: AddMBRParameterParams) {
  return prisma.mBRStepParameter.create({
    data: {
      mbrStepId: params.mbrStepId,
      parameterName: params.parameterName,
      parameterType: params.parameterType,
      unit: params.unit,
      targetValue: params.targetValue,
      minValue: params.minValue,
      maxValue: params.maxValue,
      selectionOptions: params.selectionOptions ?? undefined,
      isCritical: params.isCritical ?? false,
      sequenceOrder: params.sequenceOrder,
    },
  })
}

export async function deleteMBRParameter(id: string) {
  return prisma.mBRStepParameter.delete({ where: { id } })
}

// ============================================
// MBR IN-PROCESS CHECKS
// ============================================

interface AddMBRIPCParams {
  mbrStepId: string
  checkName: string
  checkType: CheckType
  unit?: string
  specification?: string
  targetValue?: number
  minValue?: number
  maxValue?: number
  frequency?: string
  sampleSize?: string
  isCritical?: boolean
  sequenceOrder: number
}

export async function addMBRIPCCheck(params: AddMBRIPCParams) {
  return prisma.mBRInProcessCheck.create({
    data: {
      mbrStepId: params.mbrStepId,
      checkName: params.checkName,
      checkType: params.checkType,
      unit: params.unit,
      specification: params.specification,
      targetValue: params.targetValue,
      minValue: params.minValue,
      maxValue: params.maxValue,
      frequency: params.frequency,
      sampleSize: params.sampleSize,
      isCritical: params.isCritical ?? false,
      sequenceOrder: params.sequenceOrder,
    },
  })
}

export async function deleteMBRIPCCheck(id: string) {
  return prisma.mBRInProcessCheck.delete({ where: { id } })
}

// ============================================
// MBR APPROVAL WORKFLOW
// ============================================

export async function approveMBR(mbrId: string, approvedById: string, orgId: string) {
  const mbr = await prisma.masterBatchRecord.update({
    where: { id: mbrId },
    data: {
      status: MBRStatus.approved,
      approvedById,
      approvedAt: new Date(),
    },
  })

  await logAudit({
    orgId,
    userId: approvedById,
    action: AuditAction.UPDATE,
    tableName: "master_batch_records",
    recordId: mbrId,
    fieldName: "status",
    oldValue: "draft",
    newValue: "approved",
  })

  return mbr
}

export async function submitMBRForReview(mbrId: string, userId: string, orgId: string) {
  const mbr = await prisma.masterBatchRecord.update({
    where: { id: mbrId },
    data: { status: MBRStatus.pending_review },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "master_batch_records",
    recordId: mbrId,
    fieldName: "status",
    oldValue: "draft",
    newValue: "pending_review",
  })

  return mbr
}
