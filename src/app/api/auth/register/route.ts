import { NextRequest } from "next/server"
import { registerOrganization } from "@/server/services/auth.server"
import { successResponse, errorResponse } from "@/server/utils/api-response"
import { registerOrgSchema } from "@/features/auth/schemas/auth.schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerOrgSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { orgName, licenseNumber, adminName, adminEmail, adminPassword, adminEmployeeId } = parsed.data

    const { org, admin } = await registerOrganization({
      orgName,
      licenseNumber,
      adminName,
      adminEmail,
      adminPassword,
      adminEmployeeId,
    })

    return successResponse(
      {
        orgId: org.id,
        orgName: org.name,
        userId: admin.id,
        email: admin.email,
      },
      201
    )
  } catch (error: unknown) {
    const err = error as { code?: string; meta?: { target?: string[] }; message?: string }
    if (err?.code === "EMAIL_EXISTS" || err?.code === "P2002") {
      const target: string[] = err?.meta?.target ?? []
      const msg = target.includes("license_number")
        ? "A company with this license number is already registered"
        : "An account with this email already exists"
      return errorResponse(msg, 409)
    }
    console.error("[REGISTER]", error)
    const detail = process.env.NODE_ENV === "development" ? String(err?.message ?? error) : undefined
    return errorResponse(detail ?? "Registration failed", 500)
  }
}
