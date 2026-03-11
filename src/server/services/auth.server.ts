import { prisma } from "@/server/db/prisma"
import { verifyPassword, hashPassword, hashPin } from "@/server/utils/crypto"
import { logAudit } from "@/server/services/audit-trail.server"
import { AuditAction } from "@/generated/prisma"
import type { SessionUser } from "@/features/auth/types/auth.types"

export async function authenticateUser(
  email: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  })

  if (!user || !user.isActive) return null

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) return null

  const passwordMatch = await verifyPassword(password, user.passwordHash)

  if (!passwordMatch) {
    const attempts = user.failedLoginAttempts + 1
    const lockUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockUntil,
      },
    })
    return null
  }

  // Reset failed attempts on success
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  })

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    employeeId: user.employeeId,
    role: user.role,
    orgId: user.orgId,
    designation: user.designation,
  }
}

export async function registerOrganization(params: {
  orgName: string
  licenseNumber?: string
  adminName: string
  adminEmail: string
  adminPassword: string
  adminEmployeeId: string
}) {
  // Pre-check: surface a clear error before attempting DB write
  const emailTaken = await prisma.user.findUnique({ where: { email: params.adminEmail }, select: { id: true } })
  if (emailTaken) {
    const err = new Error("An account with this email already exists") as Error & { code: string }
    err.code = "EMAIL_EXISTS"
    throw err
  }

  const passwordHash = await hashPassword(params.adminPassword)

  const org = await prisma.organization.create({
    data: {
      name: params.orgName,
      licenseNumber: params.licenseNumber,
      users: {
        create: {
          employeeId: params.adminEmployeeId,
          fullName: params.adminName,
          email: params.adminEmail,
          passwordHash,
          role: "admin",
          designation: "System Administrator",
          passwordChangedAt: new Date(),
        },
      },
    },
    include: { users: true },
  })

  const admin = org.users[0]

  await logAudit({
    orgId: org.id,
    userId: admin.id,
    userName: admin.fullName,
    userRole: admin.role,
    action: AuditAction.CREATE,
    tableName: "organizations",
    recordId: org.id,
    newValue: JSON.stringify({ name: org.name }),
  })

  // Auto-provision: OrgConfiguration + default LookupCategories + system ProcessTemplates
  // If provisioning fails, clean up the org so the user can retry registration
  try {
    await provisionNewOrg(org.id)
  } catch (provisionErr) {
    await prisma.organization.delete({ where: { id: org.id } }).catch(() => null)
    throw provisionErr
  }

  return { org, admin }
}

async function provisionNewOrg(orgId: string) {
  // 1. Create OrgConfiguration with defaults
  await prisma.orgConfiguration.upsert({
    where: { orgId },
    create: { orgId },
    update: {},
  })

  // 2. Seed default LookupCategories
  const defaultCategories = [
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

  await prisma.lookupCategory.createMany({
    data: defaultCategories.map((c) => ({ ...c, orgId })),
    skipDuplicates: true,
  })

  // 3. Seed system process templates
  await seedSystemProcessTemplates(orgId)

  // 4. Seed system ontology entities, attributes, relationships + default process graph
  await seedSystemOntology(orgId)
}

async function seedSystemProcessTemplates(orgId: string) {
  const templates = [
    {
      code: "wet-granulation",
      name: "Wet Granulation",
      description: "Standard wet granulation process for tablet manufacturing",
      category: "tablet",
      isSystem: true,
      steps: [
        {
          stepNumber: 1,
          stepName: "Line Clearance",
          stage: "Pre-Processing",
          instructions: "Verify area is clean, free of previous product. Check area clearance certificate. Verify all equipment is clean and calibrated.",
          requiresLineClearance: true,
          requiresEnvironmentalCheck: true,
          envTempMin: 18, envTempMax: 25, envHumidityMin: 40, envHumidityMax: 60,
          parameters: [],
          ipcChecks: [],
        },
        {
          stepNumber: 2,
          stepName: "Sifting",
          stage: "Pre-Processing",
          instructions: "Sift API and excipients through appropriate mesh size. Weigh and record all materials.",
          equipmentType: "sifter",
          estimatedDurationMinutes: 30,
          parameters: [
            { paramName: "Mesh Size", paramUnit: "#", minValue: 30, maxValue: 30, isCritical: true, inputType: "numeric" },
          ],
          ipcChecks: [],
        },
        {
          stepNumber: 3,
          stepName: "Dry Mixing",
          stage: "Granulation",
          instructions: "Load sifted materials into RMG. Mix at slow speed for specified time.",
          equipmentType: "rmg",
          estimatedDurationMinutes: 15,
          parameters: [
            { paramName: "Impeller Speed", paramUnit: "rpm", minValue: 100, maxValue: 150, isCritical: false, inputType: "numeric" },
            { paramName: "Mixing Time", paramUnit: "min", minValue: 10, maxValue: 15, isCritical: true, inputType: "numeric" },
          ],
          ipcChecks: [],
        },
        {
          stepNumber: 4,
          stepName: "Binder Preparation",
          stage: "Granulation",
          instructions: "Prepare binder solution as per formula. Check temperature and concentration.",
          estimatedDurationMinutes: 20,
          parameters: [
            { paramName: "Binder Concentration", paramUnit: "%w/v", minValue: 4, maxValue: 6, isCritical: true, inputType: "numeric" },
            { paramName: "Binder Temperature", paramUnit: "°C", minValue: 60, maxValue: 70, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [],
        },
        {
          stepNumber: 5,
          stepName: "Wet Granulation (Kneading)",
          stage: "Granulation",
          instructions: "Add binder solution slowly to dry mix while running impeller and chopper. Monitor granule formation.",
          equipmentType: "rmg",
          estimatedDurationMinutes: 25,
          parameters: [
            { paramName: "Impeller Speed", paramUnit: "rpm", minValue: 150, maxValue: 200, isCritical: true, inputType: "numeric" },
            { paramName: "Chopper Speed", paramUnit: "rpm", minValue: 1000, maxValue: 1500, isCritical: false, inputType: "numeric" },
            { paramName: "Kneading Time", paramUnit: "min", minValue: 8, maxValue: 12, isCritical: true, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Wet Mass Consistency", specification: "Granules should hold shape when squeezed", checkType: "visual", isCritical: true },
          ],
        },
        {
          stepNumber: 6,
          stepName: "Drying (FBD)",
          stage: "Drying",
          instructions: "Transfer wet granules to FBD. Dry at specified temperature until LOD target achieved.",
          equipmentType: "fbd",
          estimatedDurationMinutes: 60,
          parameters: [
            { paramName: "Inlet Air Temperature", paramUnit: "°C", minValue: 55, maxValue: 65, isCritical: true, inputType: "numeric" },
            { paramName: "Airflow Rate", paramUnit: "CFM", minValue: 800, maxValue: 1200, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Loss on Drying (LOD)", specification: "≤ 2.0% w/w", checkType: "measurement", isCritical: true },
          ],
        },
        {
          stepNumber: 7,
          stepName: "Sizing / Milling",
          stage: "Post-Drying",
          instructions: "Pass dried granules through sizing mill to achieve target particle size distribution.",
          estimatedDurationMinutes: 20,
          parameters: [
            { paramName: "Screen Size", paramUnit: "mm", minValue: 0.8, maxValue: 1.2, isCritical: true, inputType: "numeric" },
            { paramName: "Mill Speed", paramUnit: "rpm", minValue: 1000, maxValue: 1500, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Bulk Density", specification: "0.4–0.6 g/mL", checkType: "measurement", isCritical: false },
          ],
        },
      ],
    },
    {
      code: "capsule-filling",
      name: "Capsule Filling",
      description: "Hard gelatin capsule filling process",
      category: "capsule",
      isSystem: true,
      steps: [
        {
          stepNumber: 1,
          stepName: "Lubrication",
          stage: "Pre-Filling",
          instructions: "Add lubricant (magnesium stearate) to final blend. Mix in blender for specified time.",
          equipmentType: "blender",
          estimatedDurationMinutes: 5,
          parameters: [
            { paramName: "Blending Time", paramUnit: "min", minValue: 3, maxValue: 5, isCritical: true, inputType: "numeric" },
            { paramName: "Blender Speed", paramUnit: "rpm", minValue: 10, maxValue: 15, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [],
        },
        {
          stepNumber: 2,
          stepName: "Capsule Filling",
          stage: "Filling",
          instructions: "Set up capsule filling machine. Perform startup checks and fill capsules as per batch size.",
          equipmentType: "capsule_filler",
          estimatedDurationMinutes: 120,
          parameters: [
            { paramName: "Machine Speed", paramUnit: "caps/min", minValue: 50000, maxValue: 70000, isCritical: false, inputType: "numeric" },
            { paramName: "Fill Weight Target", paramUnit: "mg", minValue: 490, maxValue: 510, isCritical: true, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Average Fill Weight", specification: "500 mg ± 5%", checkType: "measurement", isCritical: true },
            { checkName: "Weight Variation", specification: "NMT 10 capsules deviate > ±7.5%", checkType: "measurement", isCritical: true },
          ],
        },
        {
          stepNumber: 3,
          stepName: "Final Inspection & Yield",
          stage: "Post-Filling",
          instructions: "Perform visual inspection. Calculate and record batch yield.",
          estimatedDurationMinutes: 30,
          parameters: [],
          ipcChecks: [
            { checkName: "Visual Inspection", specification: "No deformed, open, or discoloured capsules", checkType: "visual", isCritical: true },
            { checkName: "Batch Yield", specification: "95.0%–102.0%", checkType: "calculation", isCritical: true },
          ],
        },
      ],
    },
    {
      code: "film-coating",
      name: "Film Coating",
      description: "Aqueous film coating process for tablets",
      category: "tablet",
      isSystem: true,
      steps: [
        {
          stepNumber: 1,
          stepName: "Coating Solution Preparation",
          stage: "Preparation",
          instructions: "Prepare coating solution by dispersing film former in purified water. Mix until homogeneous. Add colorant if required.",
          estimatedDurationMinutes: 45,
          parameters: [
            { paramName: "Coating Solution Concentration", paramUnit: "%w/w", minValue: 12, maxValue: 15, isCritical: true, inputType: "numeric" },
            { paramName: "Mixing Time", paramUnit: "min", minValue: 30, maxValue: 45, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Solution Viscosity", specification: "150–250 cPs at 25°C", checkType: "measurement", isCritical: true },
          ],
        },
        {
          stepNumber: 2,
          stepName: "Film Coating",
          stage: "Coating",
          instructions: "Pre-heat coating pan. Load tablet cores. Apply coating solution via spray guns. Monitor tablet bed temperature and weight gain.",
          equipmentType: "coating_pan",
          estimatedDurationMinutes: 180,
          parameters: [
            { paramName: "Inlet Air Temperature", paramUnit: "°C", minValue: 55, maxValue: 65, isCritical: true, inputType: "numeric" },
            { paramName: "Tablet Bed Temperature", paramUnit: "°C", minValue: 40, maxValue: 45, isCritical: true, inputType: "numeric" },
            { paramName: "Spray Rate", paramUnit: "g/min", minValue: 80, maxValue: 120, isCritical: false, inputType: "numeric" },
            { paramName: "Pan Speed", paramUnit: "rpm", minValue: 8, maxValue: 12, isCritical: false, inputType: "numeric" },
          ],
          ipcChecks: [
            { checkName: "Weight Gain", specification: "3.0%–4.0% weight gain", checkType: "measurement", isCritical: true },
            { checkName: "Visual Appearance", specification: "Uniform colour, no picking, sticking or chipping", checkType: "visual", isCritical: true },
          ],
        },
      ],
    },
  ]

  for (const tmpl of templates) {
    const existing = await prisma.processTemplate.findUnique({
      where: { orgId_code: { orgId, code: tmpl.code } },
    })
    if (existing) continue

    const { steps, ...templateData } = tmpl
    const created = await prisma.processTemplate.create({
      data: { ...templateData, orgId },
    })

    for (const step of steps) {
      const { parameters, ipcChecks, ...stepData } = step
      const createdStep = await prisma.stepTemplate.create({
        data: { ...stepData, processTemplateId: created.id, orgId },
      })

      if (parameters.length > 0) {
        await prisma.parameterTemplate.createMany({
          data: parameters.map((p, idx) => ({
            stepTemplateId: createdStep.id,
            parameterName: p.paramName,
            parameterType: "numeric" as const,
            unit: p.paramUnit,
            minValue: p.minValue,
            maxValue: p.maxValue,
            isCritical: p.isCritical,
            sequenceOrder: idx + 1,
          })),
        })
      }
      if (ipcChecks.length > 0) {
        await prisma.iPCTemplate.createMany({
          data: ipcChecks.map((c, idx) => ({
            stepTemplateId: createdStep.id,
            checkName: c.checkName,
            checkType: (c.checkType === "visual" ? "pass_fail" : "numeric") as "pass_fail" | "numeric",
            specification: c.specification,
            isCritical: c.isCritical,
            sequenceOrder: idx + 1,
          })),
        })
      }
    }
  }
}

async function seedSystemOntology(orgId: string) {
  // System entities
  const entities = [
    { name: "product",             displayName: "Product",              icon: "FlaskConical",  sortOrder: 1 },
    { name: "material",            displayName: "Raw Material",          icon: "Package",       sortOrder: 2 },
    { name: "equipment",           displayName: "Equipment",             icon: "Wrench",        sortOrder: 3 },
    { name: "master_batch_record", displayName: "Master Batch Record",   icon: "FileText",      sortOrder: 4 },
    { name: "batch",               displayName: "Batch",                 icon: "Layers",        sortOrder: 5 },
    { name: "deviation",           displayName: "Deviation",             icon: "AlertTriangle", sortOrder: 6 },
    { name: "user",                displayName: "User",                  icon: "User",          sortOrder: 7 },
  ]

  const createdEntities: Record<string, string> = {}
  for (const e of entities) {
    const existing = await prisma.ontologyEntity.findUnique({ where: { orgId_name: { orgId, name: e.name } } })
    if (!existing) {
      const created = await prisma.ontologyEntity.create({ data: { ...e, orgId, isSystem: true } })
      createdEntities[e.name] = created.id
    } else {
      createdEntities[e.name] = existing.id
    }
  }

  // System attributes per entity (key fields)
  const attributesByEntity: Record<string, Array<{ name: string; displayName: string; dataType: "text" | "number" | "boolean" | "date" | "select" | "reference"; isRequired: boolean; sortOrder: number }>> = {
    product: [
      { name: "productCode", displayName: "Product Code", dataType: "text", isRequired: true, sortOrder: 1 },
      { name: "productName", displayName: "Product Name", dataType: "text", isRequired: true, sortOrder: 2 },
      { name: "dosageForm",  displayName: "Dosage Form",  dataType: "select", isRequired: true, sortOrder: 3 },
      { name: "strength",    displayName: "Strength",     dataType: "text", isRequired: true, sortOrder: 4 },
    ],
    material: [
      { name: "materialCode", displayName: "Material Code", dataType: "text", isRequired: true, sortOrder: 1 },
      { name: "materialName", displayName: "Material Name", dataType: "text", isRequired: true, sortOrder: 2 },
      { name: "materialType", displayName: "Material Type", dataType: "select", isRequired: true, sortOrder: 3 },
      { name: "unitOfMeasure", displayName: "Unit of Measure", dataType: "text", isRequired: true, sortOrder: 4 },
    ],
    equipment: [
      { name: "equipmentCode", displayName: "Equipment Code", dataType: "text", isRequired: true, sortOrder: 1 },
      { name: "equipmentName", displayName: "Equipment Name", dataType: "text", isRequired: true, sortOrder: 2 },
      { name: "equipmentType", displayName: "Equipment Type", dataType: "select", isRequired: true, sortOrder: 3 },
      { name: "location",      displayName: "Location",       dataType: "text", isRequired: false, sortOrder: 4 },
    ],
    master_batch_record: [
      { name: "mbrCode",     displayName: "MBR Code",    dataType: "text",   isRequired: true,  sortOrder: 1 },
      { name: "version",     displayName: "Version",     dataType: "text",   isRequired: true,  sortOrder: 2 },
      { name: "batchSize",   displayName: "Batch Size",  dataType: "number", isRequired: true,  sortOrder: 3 },
      { name: "status",      displayName: "Status",      dataType: "select", isRequired: true,  sortOrder: 4 },
    ],
    batch: [
      { name: "batchNumber",        displayName: "Batch Number",          dataType: "text",   isRequired: true,  sortOrder: 1 },
      { name: "status",             displayName: "Status",                dataType: "select", isRequired: true,  sortOrder: 2 },
      { name: "manufacturingDate",  displayName: "Manufacturing Date",    dataType: "date",   isRequired: true,  sortOrder: 3 },
      { name: "actualYield",        displayName: "Actual Yield (%)",      dataType: "number", isRequired: false, sortOrder: 4 },
    ],
    deviation: [
      { name: "deviationNumber", displayName: "Deviation Number", dataType: "text",   isRequired: true,  sortOrder: 1 },
      { name: "severity",        displayName: "Severity",         dataType: "select", isRequired: true,  sortOrder: 2 },
      { name: "status",          displayName: "Status",           dataType: "select", isRequired: true,  sortOrder: 3 },
      { name: "description",     displayName: "Description",      dataType: "text",   isRequired: true,  sortOrder: 4 },
    ],
    user: [
      { name: "employeeId", displayName: "Employee ID", dataType: "text",   isRequired: true, sortOrder: 1 },
      { name: "fullName",   displayName: "Full Name",   dataType: "text",   isRequired: true, sortOrder: 2 },
      { name: "role",       displayName: "Role",        dataType: "select", isRequired: true, sortOrder: 3 },
      { name: "department", displayName: "Department",  dataType: "text",   isRequired: false, sortOrder: 4 },
    ],
  }

  for (const [entityName, attrs] of Object.entries(attributesByEntity)) {
    const entityId = createdEntities[entityName]
    if (!entityId) continue
    await prisma.ontologyAttribute.createMany({
      data: attrs.map(a => ({ ...a, entityId, orgId, isSystem: true })),
      skipDuplicates: true,
    })
  }

  // System relationships
  const relationships = [
    { source: "product",             target: "master_batch_record", name: "has_mbrs",         displayName: "Has MBRs",          type: "one_to_many" as const },
    { source: "master_batch_record", target: "batch",               name: "has_batches",       displayName: "Has Batches",       type: "one_to_many" as const },
    { source: "batch",               target: "deviation",           name: "has_deviations",    displayName: "Has Deviations",    type: "one_to_many" as const },
    { source: "material",            target: "batch",               name: "used_in_batches",   displayName: "Used in Batches",   type: "many_to_many" as const },
    { source: "equipment",           target: "batch",               name: "used_for_batches",  displayName: "Used for Batches",  type: "many_to_many" as const },
    { source: "user",                target: "batch",               name: "executes_batches",  displayName: "Executes Batches",  type: "many_to_many" as const },
  ]

  for (const r of relationships) {
    const sourceId = createdEntities[r.source]
    const targetId = createdEntities[r.target]
    if (!sourceId || !targetId) continue
    await prisma.ontologyRelationship.upsert({
      where: { orgId_sourceEntityId_targetEntityId_name: { orgId, sourceEntityId: sourceId, targetEntityId: targetId, name: r.name } },
      create: { orgId, sourceEntityId: sourceId, targetEntityId: targetId, name: r.name, displayName: r.displayName, relationshipType: r.type, isSystem: true },
      update: {},
    })
  }

  // Default system process graph: Manufacturing Workflow
  const existingGraph = await prisma.processGraph.findFirst({ where: { orgId, name: "Manufacturing Workflow", isSystem: true } })
  if (!existingGraph) {
    const graph = await prisma.processGraph.create({ data: { orgId, name: "Manufacturing Workflow", description: "Standard pharmaceutical batch manufacturing workflow", isSystem: true } })
    const nodeData = [
      { label: "Start",                nodeType: "start"    as const, posX: 100,  posY: 250 },
      { label: "Material Dispensing",  nodeType: "step"     as const, posX: 280,  posY: 250 },
      { label: "Manufacturing",        nodeType: "step"     as const, posX: 460,  posY: 250 },
      { label: "IPC / Quality Checks", nodeType: "decision" as const, posX: 640,  posY: 250 },
      { label: "Packaging",            nodeType: "step"     as const, posX: 820,  posY: 250 },
      { label: "QA Review",            nodeType: "step"     as const, posX: 1000, posY: 250 },
      { label: "Release",              nodeType: "end"      as const, posX: 1180, posY: 250 },
    ]
    const nodes = await Promise.all(nodeData.map(n => prisma.processGraphNode.create({ data: { ...n, graphId: graph.id, orgId } })))
    for (let i = 0; i < nodes.length - 1; i++) {
      await prisma.processGraphEdge.create({ data: { graphId: graph.id, sourceNodeId: nodes[i].id, targetNodeId: nodes[i + 1].id } })
    }
  }
}

export async function setUserPin(userId: string, pin: string, orgId: string) {
  const pinHash = await hashPin(pin)
  await prisma.user.update({
    where: { id: userId },
    data: { eSignaturePinHash: pinHash },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "users",
    recordId: userId,
    fieldName: "e_signature_pin_hash",
    newValue: "[PIN SET]",
  })
}

export async function changePassword(
  userId: string,
  orgId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: "User not found" }

  const match = await verifyPassword(currentPassword, user.passwordHash)
  if (!match) return { success: false, error: "Current password is incorrect" }

  const newHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash, passwordChangedAt: new Date() },
  })

  await logAudit({
    orgId,
    userId,
    action: AuditAction.UPDATE,
    tableName: "users",
    recordId: userId,
    fieldName: "password_hash",
    newValue: "[PASSWORD CHANGED]",
  })

  return { success: true }
}
