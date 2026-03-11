import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"
import { z } from "zod"

const patchConstraintSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  errorMessage: z.string().min(1).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const constraint = await prisma.ontologyConstraint.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!constraint) return notFoundResponse("Constraint not found")

    const body = await request.json()
    const parsed = patchConstraintSchema.safeParse(body)
    if (!parsed.success) return errorResponse("Validation failed", 400, parsed.error.flatten().fieldErrors)

    const updated = await prisma.ontologyConstraint.update({
      where: { id },
      data: parsed.data,
    })
    return successResponse(updated)
  } catch (error) {
    console.error("[PATCH /api/ontology/constraints/[id]]", error)
    return errorResponse("Failed to update constraint", 500)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const { id } = await params
    const constraint = await prisma.ontologyConstraint.findFirst({
      where: { id, orgId: session.user.orgId },
    })
    if (!constraint) return notFoundResponse("Constraint not found")
    if (constraint.isSystem) return errorResponse("Cannot delete system constraints", 403)

    await prisma.ontologyConstraint.delete({ where: { id } })
    return successResponse({ id })
  } catch (error) {
    console.error("[DELETE /api/ontology/constraints/[id]]", error)
    return errorResponse("Failed to delete constraint", 500)
  }
}
