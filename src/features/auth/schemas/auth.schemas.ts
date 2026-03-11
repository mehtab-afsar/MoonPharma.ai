import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const registerOrgSchema = z.object({
  orgName: z.string().min(2, "Organization name must be at least 2 characters"),
  licenseNumber: z.string().optional(),
  adminName: z.string().min(2, "Name must be at least 2 characters"),
  adminEmail: z.string().email("Invalid email address"),
  adminEmployeeId: z.string().min(1, "Employee ID is required"),
  adminPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const setPinSchema = z.object({
  currentPassword: z.string().min(1, "Password is required to set PIN"),
  pin: z
    .string()
    .length(6, "PIN must be exactly 6 digits")
    .regex(/^\d+$/, "PIN must contain only numbers"),
  confirmPin: z.string(),
}).refine((d) => d.pin === d.confirmPin, {
  message: "PINs do not match",
  path: ["confirmPin"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterOrgInput = z.infer<typeof registerOrgSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type SetPinInput = z.infer<typeof setPinSchema>
