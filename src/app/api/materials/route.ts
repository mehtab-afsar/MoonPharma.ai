import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { getMaterials, createMaterial } from "@/server/services/material.server"
import { materialSchema } from "@/features/materials/schemas/material.schema"
import type { MaterialType } from "@/generated/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? undefined
    const type = (searchParams.get("type") ?? undefined) as MaterialType | undefined

    const materials = await getMaterials(session.user.orgId, search, type)
    return successResponse(materials)
  } catch (error) {
    console.error("[GET /api/materials]", error)
    return errorResponse("Failed to fetch materials", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const parsed = materialSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const material = await createMaterial({
      orgId: session.user.orgId,
      userId: session.user.id,
      ...parsed.data,
    })

    return successResponse(material, 201)
  } catch (error) {
    console.error("[POST /api/materials]", error)
    return errorResponse("Failed to create material", 500)
  }
}
