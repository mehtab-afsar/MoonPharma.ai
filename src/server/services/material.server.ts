import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction, type MaterialType, type PharmacoepialGrade } from "@/generated/prisma"

interface CreateMaterialParams {
  orgId: string
  userId: string
  materialCode: string
  materialName: string
  materialType: MaterialType
  unitOfMeasure: string
  pharmacoepialGrade?: PharmacoepialGrade
}

export async function createMaterial(params: CreateMaterialParams) {
  const material = await prisma.material.create({
    data: {
      orgId: params.orgId,
      materialCode: params.materialCode,
      materialName: params.materialName,
      materialType: params.materialType,
      unitOfMeasure: params.unitOfMeasure,
      pharmacoepialGrade: params.pharmacoepialGrade,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "materials",
    recordId: material.id,
    newValue: JSON.stringify({ materialCode: material.materialCode, materialName: material.materialName }),
  })

  return material
}

export async function getMaterials(orgId: string, search?: string, type?: MaterialType) {
  return prisma.material.findMany({
    where: {
      orgId,
      isActive: true,
      ...(type ? { materialType: type } : {}),
      ...(search ? {
        OR: [
          { materialName: { contains: search, mode: "insensitive" } },
          { materialCode: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { materialName: "asc" },
  })
}

export async function getMaterialById(id: string, orgId: string) {
  return prisma.material.findFirst({
    where: { id, orgId, isActive: true },
  })
}

export async function updateMaterial(
  id: string,
  orgId: string,
  userId: string,
  data: Partial<CreateMaterialParams>
) {
  const existing = await prisma.material.findFirst({ where: { id, orgId } })
  if (!existing) throw new Error("Material not found")

  const updated = await prisma.material.update({
    where: { id },
    data: {
      materialName: data.materialName,
      materialType: data.materialType,
      unitOfMeasure: data.unitOfMeasure,
      pharmacoepialGrade: data.pharmacoepialGrade,
    },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "materials",
    recordId: id,
    oldValue: JSON.stringify({ materialName: existing.materialName }),
    newValue: JSON.stringify({ materialName: updated.materialName }),
  })

  return updated
}
