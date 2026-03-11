import { UserRole } from "@/generated/prisma"
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      fullName: string
      employeeId: string
      role: string
      orgId: string
      designation?: string
    }
  }

  interface User {
    id: string
    email: string
    fullName: string
    employeeId: string
    role: UserRole
    orgId: string
    designation?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    orgId: string
    employeeId: string
    fullName: string
    designation?: string | null
  }
}
