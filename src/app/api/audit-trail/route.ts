export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  paginatedResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { AuditAction } from "@/generated/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    // Only admin, qa_head, and qa_reviewer can access the audit trail
    const allowedRoles = ["admin", "qa_head", "qa_reviewer"]
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return forbiddenResponse("You do not have permission to view the audit trail")
    }

    const { searchParams } = new URL(request.url)

    const tableNameParam = searchParams.get("tableName") ?? undefined
    const userIdParam = searchParams.get("userId") ?? undefined
    const actionParam = searchParams.get("action") ?? undefined
    const startDateParam = searchParams.get("startDate") ?? undefined
    const endDateParam = searchParams.get("endDate") ?? undefined
    const pageParam = parseInt(searchParams.get("page") ?? "1", 10)
    const limitParam = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)

    const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam
    const limit = isNaN(limitParam) || limitParam < 1 ? 50 : limitParam

    // Validate action filter
    let action: AuditAction | undefined
    if (actionParam) {
      if (!Object.values(AuditAction).includes(actionParam as AuditAction)) {
        return errorResponse(
          `Invalid action. Must be one of: ${Object.values(AuditAction).join(", ")}`,
          400
        )
      }
      action = actionParam as AuditAction
    }

    // Validate date filters
    let startDate: Date | undefined
    let endDate: Date | undefined
    if (startDateParam) {
      startDate = new Date(startDateParam)
      if (isNaN(startDate.getTime())) {
        return errorResponse("Invalid startDate. Must be a valid ISO date string.", 400)
      }
    }
    if (endDateParam) {
      endDate = new Date(endDateParam)
      if (isNaN(endDate.getTime())) {
        return errorResponse("Invalid endDate. Must be a valid ISO date string.", 400)
      }
      // Set end of day for the endDate
      endDate.setHours(23, 59, 59, 999)
    }

    const where = {
      orgId: session.user.orgId,
      ...(tableNameParam ? { tableName: tableNameParam } : {}),
      ...(userIdParam ? { userId: userIdParam } : {}),
      ...(action ? { action } : {}),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.auditTrail.count({ where }),
      prisma.auditTrail.findMany({
        where,
        include: {
          user: {
            select: {
              fullName: true,
              employeeId: true,
              role: true,
            },
          },
        },
        orderBy: { id: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    // Serialize BigInt id to string — JSON.stringify cannot handle BigInt natively
    const serializedItems = items.map((item) => ({
      ...item,
      id: item.id.toString(),
    }))

    return paginatedResponse(serializedItems, total, page, limit)
  } catch (error) {
    console.error("[GET /api/audit-trail]", error)
    return errorResponse("Failed to fetch audit trail", 500)
  }
}
