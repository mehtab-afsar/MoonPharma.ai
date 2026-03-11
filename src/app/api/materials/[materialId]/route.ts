import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import { getMaterialById, updateMaterial } from "@/server/services/material.server"
import { materialSchema } from "@/features/materials/schemas/material.schema"

interface RouteContext {
  params: Promise<{ materialId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await context.params
    const material = await getMaterialById(materialId, session.user.orgId)

    if (!material) return notFoundResponse("Material not found")

    return successResponse(material)
  } catch (error) {
    console.error("[GET /api/materials/[materialId]]", error)
    return errorResponse("Failed to fetch material", 500)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { materialId } = await context.params
    const body = await request.json()
    const parsed = materialSchema.partial().safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const material = await updateMaterial(
      materialId,
      session.user.orgId,
      session.user.id,
      parsed.data
    )

    return successResponse(material)
  } catch (error) {
    console.error("[PUT /api/materials/[materialId]]", error)
    if (error instanceof Error && error.message === "Material not found") {
      return notFoundResponse("Material not found")
    }
    return errorResponse("Failed to update material", 500)
  }
}
