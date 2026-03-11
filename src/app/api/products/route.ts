import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { getProducts, createProduct } from "@/server/services/product.server"
import { productSchema } from "@/features/products/schemas/product.schema"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") ?? undefined

    const products = await getProducts(session.user.orgId, search)
    return successResponse(products)
  } catch (error) {
    console.error("[GET /api/products]", error)
    return errorResponse("Failed to fetch products", 500)
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)
    }

    const product = await createProduct({
      orgId: session.user.orgId,
      userId: session.user.id,
      ...parsed.data,
    })

    return successResponse(product, 201)
  } catch (error) {
    console.error("[POST /api/products]", error)
    return errorResponse("Failed to create product", 500)
  }
}
