import { prisma } from "@/server/db/prisma"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction } from "@/generated/prisma"
import type { DosageForm } from "@/generated/prisma"

interface CreateProductParams {
  orgId: string
  userId: string
  productCode: string
  productName: string
  genericName?: string
  dosageForm: DosageForm
  strength: string
  shelfLifeMonths?: number
  storageConditions?: string
  regulatoryCategory?: string
}

export async function createProduct(params: CreateProductParams) {
  const product = await prisma.product.create({
    data: {
      orgId: params.orgId,
      productCode: params.productCode,
      productName: params.productName,
      genericName: params.genericName,
      dosageForm: params.dosageForm,
      strength: params.strength,
      shelfLifeMonths: params.shelfLifeMonths,
      storageConditions: params.storageConditions,
      regulatoryCategory: params.regulatoryCategory,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    action: AuditAction.CREATE,
    tableName: "products",
    recordId: product.id,
    newValue: JSON.stringify({ productCode: product.productCode, productName: product.productName }),
  })

  return product
}

export async function getProducts(orgId: string, search?: string) {
  return prisma.product.findMany({
    where: {
      orgId,
      isActive: true,
      ...(search ? {
        OR: [
          { productName: { contains: search, mode: "insensitive" } },
          { productCode: { contains: search, mode: "insensitive" } },
          { genericName: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { productName: "asc" },
    include: {
      _count: { select: { masterBatchRecords: true } },
    },
  })
}

export async function getProductById(id: string, orgId: string) {
  return prisma.product.findFirst({
    where: { id, orgId, isActive: true },
    include: {
      masterBatchRecords: {
        where: { status: { in: ["effective", "approved"] } },
        orderBy: [{ mbrCode: "asc" }, { version: "desc" }],
      },
    },
  })
}

export async function updateProduct(
  id: string,
  orgId: string,
  userId: string,
  data: Partial<CreateProductParams>
) {
  const existing = await prisma.product.findFirst({ where: { id, orgId } })
  if (!existing) throw new Error("Product not found")

  const updated = await prisma.product.update({
    where: { id },
    data: {
      productName: data.productName,
      genericName: data.genericName,
      dosageForm: data.dosageForm,
      strength: data.strength,
      shelfLifeMonths: data.shelfLifeMonths,
      storageConditions: data.storageConditions,
      regulatoryCategory: data.regulatoryCategory,
    },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "products",
    recordId: id,
    oldValue: JSON.stringify({ productName: existing.productName }),
    newValue: JSON.stringify({ productName: updated.productName }),
  })

  return updated
}

export async function deleteProduct(id: string, orgId: string, userId: string) {
  const product = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.DELETE,
    tableName: "products",
    recordId: id,
    newValue: JSON.stringify({ isActive: false }),
  })

  return product
}
