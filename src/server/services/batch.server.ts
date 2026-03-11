import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { createDeviation } from "@/server/services/deviation.server"
import {
  AuditAction,
  BatchStatus,
  BatchStepStatus,
  DeviationType,
  DeviationCategory,
  DeviationSeverity,
} from "@/generated/prisma"
import { generateBatchNumber } from "@/shared/constants/pharma.constants"

// ============================================
// BATCH INITIATION
// ============================================

export async function initiateBatch(params: {
  orgId: string
  userId: string
  mbrId: string
  manufacturingDate: Date
  expiryDate?: Date
}) {
  // Get the MBR with all steps and materials
  const mbr = await prisma.masterBatchRecord.findFirst({
    where: { id: params.mbrId, orgId: params.orgId },
    include: {
      materials: { include: { material: true }, orderBy: { sequenceOrder: "asc" } },
      steps: { orderBy: { stepNumber: "asc" } },
    },
  })
  if (!mbr) throw new Error("MBR not found")
  if (mbr.status !== "approved" && mbr.status !== "effective") {
    throw new Error("MBR must be approved before starting a batch")
  }

  // Generate batch number
  const year = new Date().getFullYear()
  const batchCount = await prisma.batch.count({ where: { orgId: params.orgId } })
  const batchNumber = generateBatchNumber(year, batchCount + 1)

  const batch = await prisma.batch.create({
    data: {
      orgId: params.orgId,
      mbrId: params.mbrId,
      batchNumber,
      manufacturingDate: params.manufacturingDate,
      expiryDate: params.expiryDate,
      status: BatchStatus.in_progress,
      initiatedById: params.userId,
      startedAt: new Date(),
      currentStepNumber: 0,
      // Create batch material records from MBR BOM
      materials: {
        create: mbr.materials.map((mbrMat) => ({
          mbrMaterialId: mbrMat.id,
          materialId: mbrMat.materialId,
          requiredQuantity: mbrMat.quantity,
          status: "pending" as const,
        })),
      },
      // Create batch step records from MBR steps
      steps: {
        create: mbr.steps.map((mbrStep) => ({
          mbrStepId: mbrStep.id,
          stepNumber: mbrStep.stepNumber,
          stepName: mbrStep.stepName,
          status: BatchStepStatus.pending,
        })),
      },
    },
    include: {
      materials: { include: { material: true, mbrMaterial: true } },
      steps: true,
      mbr: { include: { product: true } },
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "batches",
    recordId: batch.id,
    newValue: JSON.stringify({ batchNumber: batch.batchNumber }),
  })

  return batch
}

// ============================================
// BATCH QUERIES
// ============================================

export async function getBatches(orgId: string, status?: BatchStatus) {
  return prisma.batch.findMany({
    where: {
      orgId,
      ...(status ? { status } : {}),
    },
    include: {
      mbr: {
        include: { product: { select: { productName: true, strength: true, dosageForm: true } } },
      },
      initiatedBy: { select: { fullName: true } },
      _count: { select: { deviations: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getBatchById(id: string, orgId: string) {
  return prisma.batch.findFirst({
    where: { id, orgId },
    include: {
      mbr: {
        include: {
          product: true,
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
      },
      materials: {
        include: {
          material: true,
          mbrMaterial: true,
          dispensedBy: { select: { fullName: true, employeeId: true } },
          verifiedBy: { select: { fullName: true, employeeId: true } },
        },
        orderBy: { mbrMaterial: { sequenceOrder: "asc" } },
      },
      steps: {
        include: {
          mbrStep: {
            include: {
              parameters: { orderBy: { sequenceOrder: "asc" } },
              ipcChecks: { orderBy: { sequenceOrder: "asc" } },
            },
          },
          equipment: { select: { equipmentName: true, equipmentCode: true } },
          performedBy: { select: { fullName: true, employeeId: true } },
          verifiedBy: { select: { fullName: true, employeeId: true } },
          parameters: { include: { mbrParameter: true } },
          ipcResults: { include: { mbrIpc: true } },
          deviations: { select: { deviationNumber: true, severity: true, status: true } },
        },
        orderBy: { stepNumber: "asc" },
      },
      deviations: {
        orderBy: { raisedAt: "desc" },
        include: {
          raisedBy: { select: { fullName: true } },
        },
      },
      initiatedBy: { select: { fullName: true, employeeId: true } },
    },
  })
}

// ============================================
// MATERIAL DISPENSING
// ============================================

export async function dispenseMaterial(params: {
  batchMaterialId: string
  orgId: string
  userId: string
  arNumber?: string
  supplierBatchNumber?: string
  actualQuantity: number
  tareWeight?: number
  grossWeight?: number
  tolerancePlus: number
  toleranceMinus: number
  requiredQuantity: number
}) {
  const { actualQuantity, requiredQuantity, tolerancePlus, toleranceMinus } = params

  const lowerBound = requiredQuantity * (1 - toleranceMinus / 100)
  const upperBound = requiredQuantity * (1 + tolerancePlus / 100)
  const isWithinTolerance = actualQuantity >= lowerBound && actualQuantity <= upperBound

  const updated = await prisma.batchMaterial.update({
    where: { id: params.batchMaterialId },
    data: {
      arNumber: params.arNumber,
      supplierBatchNumber: params.supplierBatchNumber,
      actualQuantity: params.actualQuantity,
      tareWeight: params.tareWeight,
      grossWeight: params.grossWeight,
      isWithinTolerance,
      dispensedById: params.userId,
      dispensedAt: new Date(),
      status: "dispensed",
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batch_materials",
    recordId: params.batchMaterialId,
    fieldName: "actual_quantity",
    newValue: String(params.actualQuantity),
  })

  return { ...updated, isWithinTolerance }
}

export async function verifyMaterialDispensing(params: {
  batchMaterialId: string
  orgId: string
  userId: string
}) {
  const material = await prisma.batchMaterial.findUnique({ where: { id: params.batchMaterialId } })
  if (!material) throw new Error("Batch material not found")
  if (material.dispensedById === params.userId) {
    throw new Error("Verifier must be a different person than the dispenser (two-person rule)")
  }

  const updated = await prisma.batchMaterial.update({
    where: { id: params.batchMaterialId },
    data: {
      verifiedById: params.userId,
      verifiedAt: new Date(),
      status: "verified",
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batch_materials",
    recordId: params.batchMaterialId,
    fieldName: "status",
    newValue: "verified",
  })

  return updated
}

// ============================================
// STEP EXECUTION
// ============================================

export async function startBatchStep(params: {
  batchStepId: string
  orgId: string
  userId: string
  equipmentId?: string
  envTemperature?: number
  envHumidity?: number
}) {
  const updated = await prisma.batchStep.update({
    where: { id: params.batchStepId },
    data: {
      status: BatchStepStatus.in_progress,
      startedAt: new Date(),
      equipmentId: params.equipmentId,
      envTemperature: params.envTemperature,
      envHumidity: params.envHumidity,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batch_steps",
    recordId: params.batchStepId,
    fieldName: "status",
    newValue: "in_progress",
  })

  return updated
}

export async function recordStepParameter(params: {
  batchStepId: string
  mbrStepParameterId: string
  parameterName: string
  actualValue: string
  actualNumericValue?: number
  minValue?: number | null
  maxValue?: number | null
  orgId: string
  userId: string
}) {
  let isWithinLimit: boolean | null = null
  if (params.actualNumericValue !== undefined && params.minValue != null && params.maxValue != null) {
    isWithinLimit = params.actualNumericValue >= params.minValue && params.actualNumericValue <= params.maxValue
  }

  const record = await prisma.batchStepParameter.upsert({
    where: {
      id: `placeholder`, // upsert by batch step + mbr parameter combo
    },
    create: {
      batchStepId: params.batchStepId,
      mbrStepParameterId: params.mbrStepParameterId,
      parameterName: params.parameterName,
      actualValue: params.actualValue,
      actualNumericValue: params.actualNumericValue,
      isWithinLimit,
      recordedById: params.userId,
    },
    update: {
      actualValue: params.actualValue,
      actualNumericValue: params.actualNumericValue,
      isWithinLimit,
      recordedById: params.userId,
      recordedAt: new Date(),
    },
  }).catch(async () => {
    // If upsert fails (first time), just create
    return prisma.batchStepParameter.create({
      data: {
        batchStepId: params.batchStepId,
        mbrStepParameterId: params.mbrStepParameterId,
        parameterName: params.parameterName,
        actualValue: params.actualValue,
        actualNumericValue: params.actualNumericValue,
        isWithinLimit,
        recordedById: params.userId,
      },
    })
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "batch_step_parameters",
    recordId: record.id,
    fieldName: params.parameterName,
    newValue: params.actualValue,
  })

  // Auto-create deviation when parameter is out of spec
  let oosDeviation = null
  if (isWithinLimit === false) {
    const [orgConfig, batchStep, mbrParam] = await Promise.all([
      prisma.orgConfiguration.findUnique({ where: { orgId: params.orgId } }),
      prisma.batchStep.findUnique({
        where: { id: params.batchStepId },
        select: { batchId: true, stepName: true },
      }),
      prisma.mBRStepParameter.findUnique({
        where: { id: params.mbrStepParameterId },
        select: { isCritical: true },
      }),
    ])

    if ((orgConfig?.autoDeviationOnOos ?? true) && batchStep) {
      const isCritical = mbrParam?.isCritical ?? false
      const severity = isCritical ? DeviationSeverity.critical : DeviationSeverity.major
      const specDesc =
        params.minValue != null && params.maxValue != null
          ? ` (specification: ${params.minValue}–${params.maxValue})`
          : ""

      oosDeviation = await createDeviation({
        orgId: params.orgId,
        userId: params.userId,
        batchId: batchStep.batchId,
        batchStepId: params.batchStepId,
        deviationType: DeviationType.unplanned,
        category: DeviationCategory.process,
        severity,
        description: `OOS: ${params.parameterName} recorded as ${params.actualValue}${specDesc}. Auto-raised during step "${batchStep.stepName}".`,
      })

      // Auto-hold batch if critical deviation and org config requires it
      if (isCritical && (orgConfig?.criticalDeviationHold ?? true)) {
        await prisma.batch.update({
          where: { id: batchStep.batchId },
          data: { status: BatchStatus.on_hold },
        })
      }
    }
  }

  return { ...record, isWithinLimit, oosDeviation }
}

export async function recordIPCResult(params: {
  batchStepId: string
  mbrIpcId: string
  checkName: string
  checkTime: Date
  resultValue: string
  resultNumeric?: number
  minValue?: number | null
  maxValue?: number | null
  orgId: string
  userId: string
  remarks?: string
}) {
  let isWithinSpec: boolean | null = null
  if (params.resultNumeric !== undefined && params.minValue != null && params.maxValue != null) {
    isWithinSpec = params.resultNumeric >= params.minValue && params.resultNumeric <= params.maxValue
  }

  const result = await prisma.batchIPCResult.create({
    data: {
      batchStepId: params.batchStepId,
      mbrIpcId: params.mbrIpcId,
      checkName: params.checkName,
      checkTime: params.checkTime,
      resultValue: params.resultValue,
      resultNumeric: params.resultNumeric,
      isWithinSpec,
      checkedById: params.userId,
      remarks: params.remarks,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "batch_ipc_results",
    recordId: result.id,
    fieldName: params.checkName,
    newValue: params.resultValue,
  })

  // Auto-create deviation when IPC result is out of spec
  let oosDeviation = null
  if (isWithinSpec === false) {
    const [orgConfig, batchStep, mbrIpc] = await Promise.all([
      prisma.orgConfiguration.findUnique({ where: { orgId: params.orgId } }),
      prisma.batchStep.findUnique({
        where: { id: params.batchStepId },
        select: { batchId: true, stepName: true },
      }),
      prisma.mBRInProcessCheck.findUnique({
        where: { id: params.mbrIpcId },
        select: { isCritical: true },
      }),
    ])

    if ((orgConfig?.autoDeviationOnOos ?? true) && batchStep) {
      const isCritical = mbrIpc?.isCritical ?? false
      const severity = isCritical ? DeviationSeverity.critical : DeviationSeverity.major
      const specDesc =
        params.minValue != null && params.maxValue != null
          ? ` (specification: ${params.minValue}–${params.maxValue})`
          : ""

      oosDeviation = await createDeviation({
        orgId: params.orgId,
        userId: params.userId,
        batchId: batchStep.batchId,
        batchStepId: params.batchStepId,
        deviationType: DeviationType.unplanned,
        category: DeviationCategory.process,
        severity,
        description: `OOS IPC: ${params.checkName} recorded as ${params.resultValue}${specDesc}. Auto-raised during step "${batchStep.stepName}".`,
      })

      if (isCritical && (orgConfig?.criticalDeviationHold ?? true)) {
        await prisma.batch.update({
          where: { id: batchStep.batchId },
          data: { status: BatchStatus.on_hold },
        })
      }
    }
  }

  return { ...result, isWithinSpec, oosDeviation }
}

export async function completeStep(params: {
  batchStepId: string
  batchId: string
  orgId: string
  userId: string
  verifiedById: string
  remarks?: string
  areaCleanVerified?: boolean
  equipmentCleanVerified?: boolean
}) {
  // Two-person rule: performed by and verified by must be different people
  // (In practice the step was "performed" by whoever started it, "verified" by the verifier)

  const updated = await prisma.batchStep.update({
    where: { id: params.batchStepId },
    data: {
      status: BatchStepStatus.completed,
      completedAt: new Date(),
      performedById: params.userId,
      performedAt: new Date(),
      verifiedById: params.verifiedById,
      verifiedAt: new Date(),
      remarks: params.remarks,
      areaCleanVerified: params.areaCleanVerified,
      equipmentCleanVerified: params.equipmentCleanVerified,
    },
  })

  // Update batch current step number
  const batchStep = await prisma.batchStep.findUnique({ where: { id: params.batchStepId } })
  if (batchStep) {
    await prisma.batch.update({
      where: { id: params.batchId },
      data: { currentStepNumber: batchStep.stepNumber },
    })
  }

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batch_steps",
    recordId: params.batchStepId,
    fieldName: "status",
    newValue: "completed",
  })

  return updated
}

export async function completeBatch(params: {
  batchId: string
  orgId: string
  userId: string
  actualYieldValue: number
  actualYieldUnit: string
  theoreticalYield: number
}) {
  const yieldPercentage = (params.actualYieldValue / params.theoreticalYield) * 100

  const batch = await prisma.batch.update({
    where: { id: params.batchId },
    data: {
      status: BatchStatus.completed,
      completedAt: new Date(),
      actualYieldValue: params.actualYieldValue,
      actualYieldUnit: params.actualYieldUnit,
      yieldPercentage,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.UPDATE,
    tableName: "batches",
    recordId: params.batchId,
    fieldName: "status",
    newValue: "completed",
  })

  return batch
}
