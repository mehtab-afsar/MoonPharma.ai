import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10)
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash)
}

export function generateSignatureHash(
  userId: string,
  recordId: string,
  meaning: string,
  timestamp: Date
): string {
  const data = `${userId}|${recordId}|${meaning}|${timestamp.toISOString()}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}
