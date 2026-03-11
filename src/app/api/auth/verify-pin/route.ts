import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { verifyPin } from "@/server/utils/crypto"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { employeeId, pin } = body

    if (!employeeId || !pin) {
      return errorResponse("Employee ID and PIN are required", 400)
    }

    // Prevent self-verification (two-person rule)
    const user = await prisma.user.findFirst({
      where: {
        orgId: session.user.orgId,
        employeeId,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        employeeId: true,
        role: true,
        eSignaturePinHash: true,
      },
    })

    if (!user) {
      return errorResponse("Employee not found or inactive", 404)
    }

    if (user.id === session.user.id) {
      return errorResponse("Self-verification not allowed. A different person must verify.", 403)
    }

    if (!user.eSignaturePinHash) {
      return errorResponse("This user has no PIN configured", 400)
    }

    const pinValid = await verifyPin(pin, user.eSignaturePinHash)
    if (!pinValid) {
      return errorResponse("Invalid PIN", 401)
    }

    return successResponse({
      userId: user.id,
      fullName: user.fullName,
      employeeId: user.employeeId,
      role: user.role,
    })
  } catch (error) {
    console.error("[POST /api/auth/verify-pin]", error)
    return errorResponse("Failed to verify PIN", 500)
  }
}
