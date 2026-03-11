import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/server/db/prisma"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const templates = await prisma.processTemplate.findMany({
      where: { orgId: session.user.orgId, isActive: true },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
          include: {
            parameters: { orderBy: { sequenceOrder: "asc" } },
            ipcChecks: { orderBy: { sequenceOrder: "asc" } },
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    })

    return successResponse(templates)
  } catch (error) {
    console.error("[GET /api/process-templates]", error)
    return errorResponse("Failed to fetch process templates", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Admin only", 403)

    const body = await request.json()
    const { code, name, description, category } = body

    if (!code || !name) return errorResponse("code and name are required", 400)

    // Check uniqueness
    const existing = await prisma.processTemplate.findUnique({
      where: { orgId_code: { orgId: session.user.orgId, code } },
    })
    if (existing) return errorResponse("A process template with that code already exists", 409)

    const template = await prisma.processTemplate.create({
      data: {
        orgId: session.user.orgId,
        code,
        name,
        description,
        category: category ?? "manufacturing",
      },
      include: { steps: true },
    })

    return successResponse(template, 201)
  } catch (error) {
    console.error("[POST /api/process-templates]", error)
    return errorResponse("Failed to create process template", 500)
  }
}
