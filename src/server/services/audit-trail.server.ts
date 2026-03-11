import { prisma } from "@/server/db/prisma"
import { AuditAction } from "@/generated/prisma"

interface LogAuditParams {
  orgId?: string
  userId?: string
  userName?: string
  userRole?: string
  action: AuditAction
  tableName: string
  recordId: string
  fieldName?: string
  oldValue?: string
  newValue?: string
  reasonForChange?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Immutable audit trail logging.
 * NEVER call update or delete on this table.
 */
export async function logAudit(params: LogAuditParams) {
  return prisma.auditTrail.create({
    data: {
      orgId: params.orgId,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      tableName: params.tableName,
      recordId: params.recordId,
      fieldName: params.fieldName,
      oldValue: params.oldValue,
      newValue: params.newValue,
      reasonForChange: params.reasonForChange,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

export type { LogAuditParams }
