import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction, type EquipmentStatus } from "@/generated/prisma"

interface CreateEquipmentParams {
  orgId: string
  userId: string
  equipmentCode: string
  equipmentName: string
  equipmentType: string
  location?: string
  capacity?: string
  lastCalibrationDate?: Date
  nextCalibrationDate?: Date
}

export async function createEquipment(params: CreateEquipmentParams) {
  const equipment = await prisma.equipment.create({
    data: {
      orgId: params.orgId,
      equipmentCode: params.equipmentCode,
      equipmentName: params.equipmentName,
      equipmentType: params.equipmentType,
      location: params.location,
      capacity: params.capacity,
      lastCalibrationDate: params.lastCalibrationDate,
      nextCalibrationDate: params.nextCalibrationDate,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "equipment",
    recordId: equipment.id,
    newValue: JSON.stringify({ equipmentCode: equipment.equipmentCode }),
  })

  return equipment
}

export async function getEquipment(orgId: string, search?: string, type?: string, status?: EquipmentStatus) {
  return prisma.equipment.findMany({
    where: {
      orgId,
      isActive: true,
      ...(type ? { equipmentType: { contains: type, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { equipmentName: { contains: search, mode: "insensitive" } },
          { equipmentCode: { contains: search, mode: "insensitive" } },
          { equipmentType: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { equipmentName: "asc" },
  })
}

export async function getEquipmentById(id: string, orgId: string) {
  return prisma.equipment.findFirst({
    where: { id, orgId, isActive: true },
  })
}

export async function updateEquipmentStatus(
  id: string,
  orgId: string,
  userId: string,
  status: EquipmentStatus
) {
  const existing = await prisma.equipment.findFirst({ where: { id, orgId } })
  if (!existing) throw new Error("Equipment not found")

  const updated = await prisma.equipment.update({
    where: { id },
    data: { status },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "equipment",
    recordId: id,
    fieldName: "status",
    oldValue: existing.status,
    newValue: status,
  })

  return updated
}
