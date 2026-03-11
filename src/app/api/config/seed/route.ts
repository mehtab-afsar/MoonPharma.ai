import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { successResponse, errorResponse, unauthorizedResponse } from "@/server/utils/api-response"
import { prisma } from "@/server/db/prisma"

const DEFAULT_CATEGORIES = [
  // Material types
  { categoryType: "material_type", value: "active", label: "Active Pharmaceutical Ingredient", isSystem: true, sortOrder: 1 },
  { categoryType: "material_type", value: "excipient", label: "Excipient", isSystem: true, sortOrder: 2 },
  { categoryType: "material_type", value: "packaging", label: "Packaging Material", isSystem: true, sortOrder: 3 },
  { categoryType: "material_type", value: "consumable", label: "Consumable", isSystem: true, sortOrder: 4 },
  // Equipment types
  { categoryType: "equipment_type", value: "rmg", label: "Rapid Mixer Granulator (RMG)", isSystem: true, sortOrder: 1 },
  { categoryType: "equipment_type", value: "fbd", label: "Fluid Bed Dryer (FBD)", isSystem: true, sortOrder: 2 },
  { categoryType: "equipment_type", value: "blender", label: "Blender / Cone Blender", isSystem: true, sortOrder: 3 },
  { categoryType: "equipment_type", value: "tablet_press", label: "Tablet Press", isSystem: true, sortOrder: 4 },
  { categoryType: "equipment_type", value: "capsule_filler", label: "Capsule Filling Machine", isSystem: true, sortOrder: 5 },
  { categoryType: "equipment_type", value: "coating_pan", label: "Coating Pan", isSystem: true, sortOrder: 6 },
  { categoryType: "equipment_type", value: "sifter", label: "Vibro Sifter", isSystem: true, sortOrder: 7 },
  { categoryType: "equipment_type", value: "autoclave", label: "Autoclave", isSystem: true, sortOrder: 8 },
  { categoryType: "equipment_type", value: "water_system", label: "Purified Water System", isSystem: true, sortOrder: 9 },
  // Deviation categories
  { categoryType: "deviation_category", value: "process", label: "Process Deviation", isSystem: true, sortOrder: 1 },
  { categoryType: "deviation_category", value: "equipment", label: "Equipment Failure", isSystem: true, sortOrder: 2 },
  { categoryType: "deviation_category", value: "material", label: "Material Issue", isSystem: true, sortOrder: 3 },
  { categoryType: "deviation_category", value: "environmental", label: "Environmental Excursion", isSystem: true, sortOrder: 4 },
  { categoryType: "deviation_category", value: "human_error", label: "Human Error", isSystem: true, sortOrder: 5 },
  { categoryType: "deviation_category", value: "documentation", label: "Documentation Error", isSystem: true, sortOrder: 6 },
  // Area classes
  { categoryType: "area_class", value: "a", label: "Grade A (ISO 5)", isSystem: true, sortOrder: 1 },
  { categoryType: "area_class", value: "b", label: "Grade B (ISO 7)", isSystem: true, sortOrder: 2 },
  { categoryType: "area_class", value: "c", label: "Grade C (ISO 8)", isSystem: true, sortOrder: 3 },
  { categoryType: "area_class", value: "d", label: "Grade D (ISO 8+)", isSystem: true, sortOrder: 4 },
  { categoryType: "area_class", value: "unclassified", label: "Unclassified", isSystem: true, sortOrder: 5 },
]

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()
    if (session.user.role !== "admin") return errorResponse("Forbidden", 403)

    const orgId = session.user.orgId

    // Upsert OrgConfiguration (create with defaults if not exists)
    const config = await prisma.orgConfiguration.upsert({
      where: { orgId },
      create: { orgId },
      update: {},
    })

    const result = await prisma.lookupCategory.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, orgId })),
      skipDuplicates: true,
    })

    return successResponse({ config, categoriesCreated: result.count })
  } catch (error) {
    console.error("[POST /api/config/seed]", error)
    return errorResponse("Failed to seed configuration", 500)
  }
}
