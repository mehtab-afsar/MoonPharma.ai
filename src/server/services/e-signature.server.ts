import { prisma } from "@/server/db/prisma"
import { verifyPin, generateSignatureHash } from "@/server/utils/crypto"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction, SignatureMeaning } from "@/generated/prisma"

interface SignRecordParams {
  userId: string
  orgId: string
  pin: string
  recordType: string
  recordId: string
  meaning: SignatureMeaning
  ipAddress?: string
  userAgent?: string
}

export async function createElectronicSignature(params: SignRecordParams) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
  })

  if (!user || !user.isActive) {
    throw new Error("User not found or inactive")
  }

  if (!user.eSignaturePinHash) {
    throw new Error("E-Signature PIN not set. Please set your PIN in settings.")
  }

  const pinValid = await verifyPin(params.pin, user.eSignaturePinHash)
  if (!pinValid) {
    throw new Error("Invalid e-signature PIN")
  }

  const signedAt = new Date()
  const signatureHash = generateSignatureHash(
    params.userId,
    params.recordId,
    params.meaning,
    signedAt
  )

  const signature = await prisma.electronicSignature.create({
    data: {
      userId: params.userId,
      recordType: params.recordType,
      recordId: params.recordId,
      signatureMeaning: params.meaning,
      fullName: user.fullName,
      employeeId: user.employeeId,
      designation: user.designation,
      signedAt,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      signatureHash,
      isValid: true,
    },
  })

  await logAudit({
    orgId: params.orgId,
    userId: params.userId,
    userName: user.fullName,
    userRole: user.role,
    action: AuditAction.SIGN,
    tableName: params.recordType,
    recordId: params.recordId,
    newValue: JSON.stringify({ meaning: params.meaning, signatureId: signature.id }),
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })

  return signature
}

export async function getSignaturesForRecord(recordType: string, recordId: string) {
  return prisma.electronicSignature.findMany({
    where: { recordType, recordId, isValid: true },
    include: { user: { select: { fullName: true, employeeId: true, role: true } } },
    orderBy: { signedAt: "asc" },
  })
}
