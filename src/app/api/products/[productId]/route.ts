import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from "@/server/utils/api-response"
import {
  getProductById,
  updateProduct,
  deleteProduct,
} from "@/server/services/product.server"
import { productSchema } from "@/features/products/schemas/product.schema"

interface RouteContext {
  params: Promise<{ productId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { productId } = await context.params
    const product = await getProductById(productId, session.user.orgId)

    if (!product) return notFoundResponse("Product not found")

    return successResponse(product)
  } catch (error) {
    console.error("[GET /api/products/[productId]]", error)
    return errorResponse("Failed to fetch product", 500)
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { productId } = await context.params
    const body = await request.json()
    const parsed = productSchema.partial().safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const product = await updateProduct(
      productId,
      session.user.orgId,
      session.user.id,
      parsed.data
    )

    return successResponse(product)
  } catch (error) {
    console.error("[PUT /api/products/[productId]]", error)
    if (error instanceof Error && error.message === "Product not found") {
      return notFoundResponse("Product not found")
    }
    return errorResponse("Failed to update product", 500)
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { productId } = await context.params
    const product = await deleteProduct(productId, session.user.orgId, session.user.id)

    return successResponse(product)
  } catch (error) {
    console.error("[DELETE /api/products/[productId]]", error)
    return errorResponse("Failed to delete product", 500)
  }
}
