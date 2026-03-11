import { UserRole } from "@/generated/prisma"

export interface SessionUser {
  id: string
  email: string
  fullName: string
  employeeId: string
  role: UserRole
  orgId: string
  designation?: string | null
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterOrgPayload {
  orgName: string
  licenseNumber?: string
  adminName: string
  adminEmail: string
  adminPassword: string
  adminEmployeeId: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface SetPinPayload {
  pin: string
  confirmPin: string
  currentPassword: string
}

export interface VerifySignaturePayload {
  pin: string
  meaning: string
}
