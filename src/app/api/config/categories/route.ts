import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const VALID_CATEGORY_TYPES = ["material_type", "equipment_type", "deviation_category", "area_class"] as const

const createCategorySchema = z.object({
  categoryType: z.enum(VALID_CATEGORY_TYPES),
  value: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, underscores"),
  label: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") ?? undefined

    const categories = await prisma.lookupCategory.findMany({
      where: {
        orgId: session.user.orgId,
        ...(type ? { categoryType: type } : {}),
      },
      orderBy: [{ categoryType: "asc" }, { sortOrder: "asc" }, { label: "asc" }],
    })

    return successResponse(categories)
  } catch (error) {
    console.error("[GET /api/config/categories]", error)
    return errorResponse("Failed to fetch categories", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const { categoryType, value, label, sortOrder } = parsed.data

    const category = await prisma.lookupCategory.create({
      data: {
        orgId: session.user.orgId,
        categoryType,
        value,
        label,
        sortOrder: sortOrder ?? 0,
        isSystem: false,
      },
    })

    return successResponse(category, 201)
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return errorResponse("A category with this value already exists", 409)
    }
    console.error("[POST /api/config/categories]", error)
    return errorResponse("Failed to create category", 500)
  }
}
