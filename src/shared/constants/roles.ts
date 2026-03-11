import { UserRole } from "@/generated/prisma"

export const ROLES = UserRole

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  production_head: "Production Head",
  supervisor: "Supervisor",
  operator: "Operator",
  qa_reviewer: "QA Reviewer",
  qa_head: "QA Head",
}

// Permissions per role
export const ROLE_PERMISSIONS = {
  admin: [
    "users:read", "users:write",
    "products:read", "products:write",
    "materials:read", "materials:write",
    "equipment:read", "equipment:write",
    "mbr:read", "mbr:write", "mbr:approve",
    "batches:read", "batches:write", "batches:initiate",
    "deviations:read", "deviations:write",
    "review:read", "review:approve",
    "audit:read",
    "reports:read",
    "settings:read", "settings:write",
  ],
  production_head: [
    "products:read",
    "materials:read",
    "equipment:read",
    "mbr:read", "mbr:write", "mbr:approve",
    "batches:read", "batches:initiate",
    "deviations:read",
    "review:read",
    "audit:read",
    "reports:read",
  ],
  supervisor: [
    "products:read",
    "materials:read",
    "equipment:read",
    "mbr:read",
    "batches:read", "batches:write", "batches:initiate",
    "deviations:read", "deviations:write",
    "review:read",
    "reports:read",
  ],
  operator: [
    "products:read",
    "materials:read",
    "equipment:read",
    "mbr:read",
    "batches:read", "batches:execute",
    "deviations:read", "deviations:write",
  ],
  qa_reviewer: [
    "products:read",
    "materials:read",
    "equipment:read",
    "mbr:read",
    "batches:read",
    "deviations:read", "deviations:write",
    "review:read", "review:write",
    "audit:read",
    "reports:read",
  ],
  qa_head: [
    "products:read",
    "materials:read",
    "equipment:read",
    "mbr:read",
    "batches:read",
    "deviations:read", "deviations:write",
    "review:read", "review:write", "review:approve",
    "audit:read",
    "reports:read",
  ],
} as const

export type Permission = typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS][number]

export function hasPermission(role: UserRole, permission: string): boolean {
  return (ROLE_PERMISSIONS[role] as readonly string[]).includes(permission)
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissionMap: Record<string, string> = {
    "/settings": "settings:read",
    "/audit-trail": "audit:read",
    "/review-queue": "review:read",
    "/mbr/new": "mbr:write",
    "/batches/new": "batches:initiate",
  }
  const required = routePermissionMap[route]
  if (!required) return true
  return hasPermission(role, required)
}
