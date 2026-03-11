import { PrismaClient, Prisma } from "../../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  const ORG_ID = "org-moonpharma-01"

  const org = await prisma.organization.findUnique({ where: { id: ORG_ID } })
  if (!org) throw new Error(`Organization ${ORG_ID} not found`)

  console.log("Deleting existing ontology data...")

  // Delete in dependency order
  await prisma.ontologyConstraint.deleteMany({ where: { orgId: ORG_ID } })
  await prisma.ontologyLifecycleTransition.deleteMany({
    where: { lifecycle: { orgId: ORG_ID } },
  })
  await prisma.ontologyLifecycleState.deleteMany({
    where: { lifecycle: { orgId: ORG_ID } },
  })
  await prisma.ontologyLifecycle.deleteMany({ where: { orgId: ORG_ID } })
  await prisma.ontologyRelationship.deleteMany({ where: { orgId: ORG_ID } })
  await prisma.ontologyAttribute.deleteMany({ where: { orgId: ORG_ID } })
  await prisma.ontologyEntity.deleteMany({ where: { orgId: ORG_ID } })
  await prisma.processGraphEdge.deleteMany({ where: { graph: { orgId: ORG_ID } } })
  await prisma.processGraphNode.deleteMany({ where: { graph: { orgId: ORG_ID } } })
  // Note: processGraphNode doesn't have orgId directly; graph deletion cascades
  await prisma.processGraph.deleteMany({ where: { orgId: ORG_ID } })

  console.log("Creating entities...")

  // ─── ENTITIES ─────────────────────────────────────────────────
  type EntityDef = {
    name: string; displayName: string; pluralLabel: string; group: string;
    color: string; prismaModel: string | null; appRoute: string | null;
    hasLifecycle: boolean; isVersioned?: boolean;
  }
  const entityDefs: EntityDef[] = [
    // master_data
    {
      name: "product", displayName: "Product", pluralLabel: "Products", group: "master_data",
      color: "#0f172a", prismaModel: "Product", appRoute: "/products", hasLifecycle: true,
    },
    {
      name: "raw_material", displayName: "Raw Material", pluralLabel: "Raw Materials", group: "master_data",
      color: "#1e40af", prismaModel: "Material", appRoute: "/materials", hasLifecycle: true,
    },
    {
      name: "equipment", displayName: "Equipment", pluralLabel: "Equipment", group: "master_data",
      color: "#065f46", prismaModel: "Equipment", appRoute: "/equipment", hasLifecycle: true,
    },
    {
      name: "area", displayName: "Area / Room", pluralLabel: "Areas", group: "master_data",
      color: "#4c1d95", prismaModel: null, appRoute: null, hasLifecycle: false,
    },
    // operations
    {
      name: "mbr", displayName: "Master Batch Record", pluralLabel: "MBRs", group: "operations",
      color: "#78350f", prismaModel: "MasterBatchRecord", appRoute: "/mbr", hasLifecycle: true, isVersioned: true,
    },
    {
      name: "batch", displayName: "Batch", pluralLabel: "Batches", group: "operations",
      color: "#1f2937", prismaModel: "Batch", appRoute: "/batches", hasLifecycle: true,
    },
    {
      name: "batch_step", displayName: "Batch Step", pluralLabel: "Batch Steps", group: "operations",
      color: "#374151", prismaModel: "BatchStep", appRoute: null, hasLifecycle: true,
    },
    // quality
    {
      name: "deviation", displayName: "Deviation", pluralLabel: "Deviations", group: "quality",
      color: "#7f1d1d", prismaModel: "Deviation", appRoute: "/deviations", hasLifecycle: true,
    },
    {
      name: "ipc_result", displayName: "IPC Result", pluralLabel: "IPC Results", group: "quality",
      color: "#92400e", prismaModel: "BatchIPCResult", appRoute: null, hasLifecycle: false,
    },
    {
      name: "batch_review", displayName: "Batch Review", pluralLabel: "Batch Reviews", group: "quality",
      color: "#14532d", prismaModel: "BatchReview", appRoute: null, hasLifecycle: true,
    },
    {
      name: "capa", displayName: "CAPA", pluralLabel: "CAPAs", group: "quality",
      color: "#4c1d95", prismaModel: null, appRoute: null, hasLifecycle: true,
    },
    // people
    {
      name: "user", displayName: "User", pluralLabel: "Users", group: "people",
      color: "#1e3a5f", prismaModel: "User", appRoute: null, hasLifecycle: false,
    },
    {
      name: "role", displayName: "Role", pluralLabel: "Roles", group: "people",
      color: "#374151", prismaModel: null, appRoute: null, hasLifecycle: false,
    },
    {
      name: "department", displayName: "Department", pluralLabel: "Departments", group: "people",
      color: "#374151", prismaModel: null, appRoute: null, hasLifecycle: false,
    },
    // documents
    {
      name: "sop", displayName: "SOP", pluralLabel: "SOPs", group: "documents",
      color: "#1a1a2e", prismaModel: null, appRoute: null, hasLifecycle: true, isVersioned: true,
    },
  ]

  const entityMap: Record<string, string> = {}
  for (let i = 0; i < entityDefs.length; i++) {
    const def = entityDefs[i]
    const entity = await prisma.ontologyEntity.create({
      data: {
        orgId: ORG_ID,
        name: def.name,
        displayName: def.displayName,
        pluralLabel: def.pluralLabel,
        group: def.group,
        color: def.color ?? null,
        prismaModel: def.prismaModel ?? null,
        appRoute: def.appRoute ?? null,
        hasLifecycle: def.hasLifecycle ?? false,
        isVersioned: def.isVersioned ?? false,
        isSystem: true,
        isActive: true,
        isAuditable: true,
        isSoftDelete: true,
        sortOrder: i,
      },
    })
    entityMap[def.name] = entity.id
  }

  console.log("Creating attributes...")

  // ─── ATTRIBUTES HELPER ────────────────────────────────────────
  type AttrDef = {
    name: string
    displayName: string
    dataType: string
    isRequired?: boolean
    isUnique?: boolean
    section?: string
    sectionOrder?: number
    unit?: string
    minValue?: number
    maxValue?: number
    pattern?: string
    patternMessage?: string
    enumOptions?: string[]
    isCritical?: boolean
    prismaField?: string
    formula?: string
    defaultValue?: string
    sortOrder?: number
  }

  async function createAttrs(entityName: string, attrs: AttrDef[]) {
    const entityId = entityMap[entityName]
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i]
      await prisma.ontologyAttribute.create({
        data: {
          entityId,
          orgId: ORG_ID,
          name: a.name,
          displayName: a.displayName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dataType: a.dataType as any,
          isRequired: a.isRequired ?? false,
          isUnique: a.isUnique ?? false,
          isSystem: true,
          section: a.section ?? null,
          sectionOrder: a.sectionOrder ?? 0,
          unit: a.unit ?? null,
          minValue: a.minValue != null ? String(a.minValue) : null,
          maxValue: a.maxValue != null ? String(a.maxValue) : null,
          pattern: a.pattern ?? null,
          patternMessage: a.patternMessage ?? null,
          enumOptions: a.enumOptions ? a.enumOptions : Prisma.JsonNull,
          isCritical: a.isCritical ?? false,
          prismaField: a.prismaField ?? null,
          formula: a.formula ?? null,
          defaultValue: a.defaultValue ?? null,
          sortOrder: a.sortOrder ?? i,
        },
      })
    }
  }

  // PRODUCT
  await createAttrs("product", [
    { name: "product_name", displayName: "Product Name", dataType: "text", isRequired: true, section: "General", sectionOrder: 0, prismaField: "productName" },
    { name: "generic_name", displayName: "Generic Name", dataType: "text", section: "General", sectionOrder: 1, prismaField: "genericName" },
    { name: "product_code", displayName: "Product Code", dataType: "text", isRequired: true, isUnique: true, section: "General", sectionOrder: 2, prismaField: "productCode" },
    { name: "strength", displayName: "Strength", dataType: "text", isRequired: true, section: "General", sectionOrder: 3, prismaField: "strength" },
    { name: "dosage_form", displayName: "Dosage Form", dataType: "select", isRequired: true, section: "General", sectionOrder: 4, prismaField: "dosageForm", enumOptions: ["Tablet","Capsule","Syrup","Injection","Cream","Ointment","Powder","Granules"] },
    { name: "therapeutic_category", displayName: "Therapeutic Category", dataType: "select", section: "Classification", sectionOrder: 0, enumOptions: ["Analgesic","Antibiotic","Antifungal","Cardiovascular","Antidiabetic","Gastrointestinal","Respiratory","Other"] },
    { name: "schedule_category", displayName: "Schedule Category", dataType: "select", section: "Classification", sectionOrder: 1, enumOptions: ["Schedule_H","Schedule_H1","Schedule_X","OTC"] },
    { name: "shelf_life_months", displayName: "Shelf Life (months)", dataType: "number", isRequired: true, section: "Storage", sectionOrder: 0, unit: "months", minValue: 1, maxValue: 120, prismaField: "shelfLifeMonths" },
    { name: "storage_conditions", displayName: "Storage Conditions", dataType: "select", isRequired: true, section: "Storage", sectionOrder: 1, enumOptions: ["Room Temperature (15-30°C)","Cool (8-15°C)","Refrigerated (2-8°C)","Frozen (-20°C)"] },
  ])

  // RAW MATERIAL
  await createAttrs("raw_material", [
    { name: "material_code", displayName: "Material Code", dataType: "text", isRequired: true, isUnique: true, section: "Identification", sectionOrder: 0, prismaField: "materialCode" },
    { name: "material_name", displayName: "Material Name", dataType: "text", isRequired: true, section: "Identification", sectionOrder: 1, prismaField: "materialName" },
    { name: "cas_number", displayName: "CAS Number", dataType: "text", section: "Identification", sectionOrder: 2, pattern: "^\\d{2,7}-\\d{2}-\\d$", patternMessage: "Format: XXXXX-XX-X" },
    { name: "material_type", displayName: "Material Type", dataType: "select", isRequired: true, section: "Classification", sectionOrder: 0, enumOptions: ["active","excipient","packaging","consumable"] },
    { name: "grade", displayName: "Grade", dataType: "select", isRequired: true, section: "Classification", sectionOrder: 1, enumOptions: ["IP","BP","USP","EP","JP","In_house","NF"] },
    { name: "storage_condition", displayName: "Storage Condition", dataType: "select", isRequired: true, section: "Storage", sectionOrder: 0, enumOptions: ["Ambient","Cool","Refrigerated","Frozen","Desiccator"] },
    { name: "reorder_level", displayName: "Reorder Level", dataType: "number", section: "Storage", sectionOrder: 1, unit: "kg" },
    { name: "retest_period_months", displayName: "Retest Period", dataType: "number", section: "Storage", sectionOrder: 2, unit: "months" },
  ])

  // EQUIPMENT
  await createAttrs("equipment", [
    { name: "equipment_code", displayName: "Equipment Code", dataType: "text", isRequired: true, isUnique: true, section: "Identification", sectionOrder: 0, prismaField: "equipmentCode" },
    { name: "equipment_name", displayName: "Equipment Name", dataType: "text", isRequired: true, section: "Identification", sectionOrder: 1, prismaField: "equipmentName" },
    { name: "equipment_type", displayName: "Equipment Type", dataType: "select", isRequired: true, section: "Identification", sectionOrder: 2, enumOptions: ["granulator","mixer","tablet_press","capsule_filler","coating_pan","autoclave","balance","oven","sifter","other"] },
    { name: "model", displayName: "Model", dataType: "text", section: "Technical", sectionOrder: 0 },
    { name: "serial_number", displayName: "Serial Number", dataType: "text", section: "Technical", sectionOrder: 1 },
    { name: "manufacturer", displayName: "Manufacturer", dataType: "text", section: "Technical", sectionOrder: 2 },
    { name: "qualification_status", displayName: "Qualification Status", dataType: "select", isRequired: true, section: "Status", sectionOrder: 0, enumOptions: ["not_qualified","IQ_done","OQ_done","PQ_done","qualified","requalification_due","decommissioned"] },
    { name: "calibration_due_date", displayName: "Calibration Due Date", dataType: "date", section: "Calibration", sectionOrder: 0, prismaField: "nextCalibrationDate" },
    { name: "last_calibration", displayName: "Last Calibration Date", dataType: "date", section: "Calibration", sectionOrder: 1 },
  ])

  // MBR
  await createAttrs("mbr", [
    { name: "mbr_code", displayName: "MBR Code", dataType: "text", isRequired: true, isUnique: true, section: "Identification", sectionOrder: 0, prismaField: "mbrCode" },
    { name: "version", displayName: "Version", dataType: "number", isRequired: true, section: "Identification", sectionOrder: 1, defaultValue: "1" },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, section: "Identification", sectionOrder: 2, enumOptions: ["draft","pending_review","approved","superseded","obsolete"] },
    { name: "batch_size_value", displayName: "Batch Size Value", dataType: "number", isRequired: true, section: "Batch Parameters", sectionOrder: 0 },
    { name: "batch_size_unit", displayName: "Batch Size Unit", dataType: "select", isRequired: true, section: "Batch Parameters", sectionOrder: 1, enumOptions: ["kg","L","nos","units"] },
    { name: "yield_limit_min", displayName: "Min Yield Limit", dataType: "number", isRequired: true, section: "Batch Parameters", sectionOrder: 2, unit: "%", defaultValue: "95" },
    { name: "yield_limit_max", displayName: "Max Yield Limit", dataType: "number", isRequired: true, section: "Batch Parameters", sectionOrder: 3, unit: "%", defaultValue: "105" },
  ])

  // BATCH
  await createAttrs("batch", [
    { name: "batch_number", displayName: "Batch Number", dataType: "text", isRequired: true, isUnique: true, section: "Identification", sectionOrder: 0, prismaField: "batchNumber" },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, section: "Identification", sectionOrder: 1, enumOptions: ["planned","in_progress","on_hold","under_review","approved","rejected","cancelled"], prismaField: "status" },
    { name: "manufacturing_date", displayName: "Manufacturing Date", dataType: "date", isRequired: true, section: "Schedule", sectionOrder: 0 },
    { name: "expiry_date", displayName: "Expiry Date", dataType: "date", isRequired: true, section: "Schedule", sectionOrder: 1 },
    { name: "actual_yield", displayName: "Actual Yield", dataType: "number", section: "Yield", sectionOrder: 0, unit: "kg" },
    { name: "yield_percentage", displayName: "Yield %", dataType: "computed", section: "Yield", sectionOrder: 1, formula: "(actual_yield / mbr.theoretical_yield) * 100", isCritical: true },
    { name: "deviation_count", displayName: "Deviation Count", dataType: "computed", section: "Summary", sectionOrder: 0, formula: "COUNT(deviations WHERE batch = this)" },
  ])

  // DEVIATION
  await createAttrs("deviation", [
    { name: "deviation_number", displayName: "Deviation Number", dataType: "text", isRequired: true, isUnique: true, section: "Identification", sectionOrder: 0, prismaField: "deviationNumber" },
    { name: "title", displayName: "Title", dataType: "text", isRequired: true, section: "Identification", sectionOrder: 1 },
    { name: "description", displayName: "Description", dataType: "textarea", isRequired: true, section: "Identification", sectionOrder: 2 },
    { name: "severity", displayName: "Severity", dataType: "select", isRequired: true, section: "Classification", sectionOrder: 0, enumOptions: ["minor","major","critical"] },
    { name: "category", displayName: "Category", dataType: "select", isRequired: true, section: "Classification", sectionOrder: 1, enumOptions: ["process","equipment","material","environmental"] },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, section: "Classification", sectionOrder: 2, enumOptions: ["open","under_investigation","pending_capa","closed"] },
    { name: "root_cause", displayName: "Root Cause", dataType: "textarea", section: "Investigation", sectionOrder: 0 },
    { name: "root_cause_category", displayName: "Root Cause Category", dataType: "select", section: "Investigation", sectionOrder: 1, enumOptions: ["human_error","equipment_failure","process_gap","material_defect","environmental","design_flaw"] },
    { name: "corrective_action", displayName: "Corrective Action", dataType: "textarea", section: "CAPA", sectionOrder: 0 },
    { name: "preventive_action", displayName: "Preventive Action", dataType: "textarea", section: "CAPA", sectionOrder: 1 },
    { name: "capa_status", displayName: "CAPA Status", dataType: "select", section: "CAPA", sectionOrder: 2, enumOptions: ["not_required","pending","in_progress","completed","verified"] },
  ])

  // AREA
  await createAttrs("area", [
    { name: "area_code", displayName: "Area Code", dataType: "text", isRequired: true, isUnique: true, section: "General", sectionOrder: 0 },
    { name: "area_name", displayName: "Area Name", dataType: "text", isRequired: true, section: "General", sectionOrder: 1 },
    { name: "area_type", displayName: "Area Type", dataType: "select", isRequired: true, section: "General", sectionOrder: 2, enumOptions: ["production","packaging","warehouse","qc_lab","utility","corridor","gowning","airlock"] },
    { name: "cleanliness_class", displayName: "Cleanliness Class", dataType: "select", section: "General", sectionOrder: 3, enumOptions: ["A","B","C","D","unclassified"] },
  ])

  // BATCH STEP
  await createAttrs("batch_step", [
    { name: "step_number", displayName: "Step Number", dataType: "number", isRequired: true },
    { name: "step_name", displayName: "Step Name", dataType: "text", isRequired: true },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, enumOptions: ["pending","in_progress","completed","skipped_with_deviation"] },
    { name: "equipment_used", displayName: "Equipment Used", dataType: "reference" },
  ])

  // IPC RESULT
  await createAttrs("ipc_result", [
    { name: "check_name", displayName: "Check Name", dataType: "text", isRequired: true },
    { name: "result_value", displayName: "Result Value", dataType: "text" },
    { name: "is_within_spec", displayName: "Within Spec", dataType: "boolean" },
    { name: "checked_at", displayName: "Checked At", dataType: "datetime" },
  ])

  // BATCH REVIEW
  await createAttrs("batch_review", [
    { name: "review_type", displayName: "Review Type", dataType: "select", isRequired: true, enumOptions: ["production_review","qa_review","qa_head_approval"] },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, enumOptions: ["pending","in_progress","approved","rejected","returned_for_correction"] },
    { name: "comments", displayName: "Comments", dataType: "textarea" },
    { name: "completed_at", displayName: "Completed At", dataType: "datetime" },
  ])

  // CAPA
  await createAttrs("capa", [
    { name: "capa_number", displayName: "CAPA Number", dataType: "text", isRequired: true, isUnique: true },
    { name: "description", displayName: "Description", dataType: "textarea", isRequired: true },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, enumOptions: ["pending","in_progress","completed","verified"] },
    { name: "due_date", displayName: "Due Date", dataType: "date" },
  ])

  // USER
  await createAttrs("user", [
    { name: "full_name", displayName: "Full Name", dataType: "text", isRequired: true, prismaField: "fullName" },
    { name: "email", displayName: "Email", dataType: "email", isRequired: true, isUnique: true },
    { name: "role", displayName: "Role", dataType: "select", isRequired: true, enumOptions: ["admin","production_head","supervisor","operator","qa_reviewer","qa_head"] },
    { name: "employee_id", displayName: "Employee ID", dataType: "text", isRequired: true, isUnique: true },
  ])

  // ROLE
  await createAttrs("role", [
    { name: "role_code", displayName: "Role Code", dataType: "text", isRequired: true },
    { name: "permissions", displayName: "Permissions", dataType: "textarea" },
  ])

  // DEPARTMENT
  await createAttrs("department", [
    { name: "dept_code", displayName: "Department Code", dataType: "text", isRequired: true },
    { name: "dept_name", displayName: "Department Name", dataType: "text", isRequired: true },
  ])

  // SOP
  await createAttrs("sop", [
    { name: "sop_number", displayName: "SOP Number", dataType: "text", isRequired: true, isUnique: true },
    { name: "title", displayName: "Title", dataType: "text", isRequired: true },
    { name: "version", displayName: "Version", dataType: "number", isRequired: true, defaultValue: "1" },
    { name: "status", displayName: "Status", dataType: "select", isRequired: true, enumOptions: ["draft","under_review","approved","obsolete"] },
  ])

  console.log("Creating relationships...")

  // ─── RELATIONSHIPS ────────────────────────────────────────────
  type RelDef = {
    source: string
    target: string
    name: string
    displayName: string
    type: "one_to_one" | "one_to_many" | "many_to_many" | "many_to_one"
    forwardLabel?: string
    reverseLabel?: string
    isRequired?: boolean
    hasBridgeEntity?: boolean
    prismaRelation?: string
  }

  const rels: RelDef[] = [
    { source: "product", target: "mbr", name: "has_mbr", displayName: "has Master Batch Records", type: "one_to_many", forwardLabel: "has Master Batch Records", reverseLabel: "belongs to Product" },
    { source: "product", target: "sop", name: "has_specification", displayName: "has Specifications", type: "one_to_many", forwardLabel: "has Specifications", reverseLabel: "specifies Product" },
    { source: "equipment", target: "area", name: "located_in", displayName: "is located in", type: "many_to_one", forwardLabel: "is located in", reverseLabel: "contains Equipment" },
    { source: "area", target: "area", name: "has_parent_area", displayName: "is sub-area of", type: "many_to_one", forwardLabel: "is sub-area of", reverseLabel: "contains sub-areas" },
    { source: "mbr", target: "batch", name: "has_batch", displayName: "has Batches", type: "one_to_many", forwardLabel: "has Batches", reverseLabel: "follows MBR", isRequired: true },
    { source: "mbr", target: "raw_material", name: "requires_material", displayName: "requires Materials (BOM)", type: "many_to_many", forwardLabel: "requires Materials (BOM)", reverseLabel: "is used in MBR", hasBridgeEntity: true },
    { source: "mbr", target: "equipment", name: "requires_equipment", displayName: "requires Equipment", type: "many_to_many", forwardLabel: "requires Equipment", reverseLabel: "is required by MBR" },
    { source: "batch", target: "batch_step", name: "has_step", displayName: "has Step Executions", type: "one_to_many", forwardLabel: "has Step Executions", reverseLabel: "belongs to Batch" },
    { source: "batch", target: "raw_material", name: "uses_material", displayName: "uses Materials", type: "many_to_many", forwardLabel: "uses Materials", reverseLabel: "is consumed in Batch" },
    { source: "batch", target: "equipment", name: "uses_equipment", displayName: "uses Equipment", type: "many_to_many", forwardLabel: "uses Equipment", reverseLabel: "is used in Batch" },
    { source: "batch", target: "area", name: "manufactured_in", displayName: "is manufactured in", type: "many_to_one", forwardLabel: "is manufactured in", reverseLabel: "hosts Batch" },
    { source: "batch", target: "deviation", name: "has_deviation", displayName: "has Deviations", type: "one_to_many", forwardLabel: "has Deviations", reverseLabel: "raised against Batch" },
    { source: "batch", target: "batch_review", name: "has_review", displayName: "has Reviews", type: "one_to_many", forwardLabel: "has Reviews", reverseLabel: "reviews Batch" },
    { source: "batch_step", target: "ipc_result", name: "has_ipc", displayName: "has IPC Results", type: "one_to_many", forwardLabel: "has IPC Results", reverseLabel: "checked at Step" },
    { source: "deviation", target: "capa", name: "has_capa", displayName: "has CAPA", type: "one_to_one", forwardLabel: "has CAPA", reverseLabel: "addresses Deviation" },
    { source: "deviation", target: "batch", name: "triggers_hold", displayName: "triggers hold on", type: "many_to_one", forwardLabel: "triggers hold on", reverseLabel: "is held due to" },
    { source: "user", target: "batch", name: "initiates", displayName: "initiates Batches", type: "one_to_many", forwardLabel: "initiates Batches", reverseLabel: "initiated by" },
    { source: "user", target: "batch_step", name: "performs_step", displayName: "performs Steps", type: "one_to_many", forwardLabel: "performs Steps", reverseLabel: "performed by" },
    { source: "user", target: "batch_step", name: "verifies_step", displayName: "verifies Steps", type: "one_to_many", forwardLabel: "verifies Steps", reverseLabel: "verified by" },
    { source: "user", target: "batch_review", name: "reviews", displayName: "reviews Batches", type: "one_to_many", forwardLabel: "reviews Batches", reverseLabel: "reviewed by" },
    { source: "user", target: "deviation", name: "detects_deviation", displayName: "detects Deviations", type: "one_to_many", forwardLabel: "detects Deviations", reverseLabel: "detected by" },
    { source: "user", target: "department", name: "belongs_to_dept", displayName: "belongs to", type: "many_to_one", forwardLabel: "belongs to", reverseLabel: "has Members" },
    { source: "raw_material", target: "area", name: "stored_in", displayName: "is stored in", type: "many_to_one", forwardLabel: "is stored in", reverseLabel: "stores Material" },
    { source: "equipment", target: "sop", name: "has_sop", displayName: "has Operating SOP", type: "many_to_many", forwardLabel: "has Operating SOP", reverseLabel: "applies to Equipment" },
    { source: "product", target: "deviation", name: "has_product_deviation", displayName: "has Deviations (via batch)", type: "one_to_many", forwardLabel: "has Deviations (via batch)", reverseLabel: "related to Product" },
  ]

  for (const rel of rels) {
    await prisma.ontologyRelationship.create({
      data: {
        orgId: ORG_ID,
        sourceEntityId: entityMap[rel.source],
        targetEntityId: entityMap[rel.target],
        name: rel.name,
        displayName: rel.displayName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relationshipType: rel.type as any,
        forwardLabel: rel.forwardLabel ?? "",
        reverseLabel: rel.reverseLabel ?? "",
        isRequired: rel.isRequired ?? false,
        hasBridgeEntity: rel.hasBridgeEntity ?? false,
        prismaRelation: rel.prismaRelation ?? null,
        isSystem: true,
      },
    })
  }

  console.log("Creating lifecycles...")

  // ─── LIFECYCLES ───────────────────────────────────────────────
  async function createLifecycle(
    entityName: string,
    name: string,
    states: Array<{ code: string; label: string; color: string; isInitial?: boolean; isTerminal?: boolean; sortOrder?: number }>,
    transitions: Array<{ fromCode: string; toCode: string; action: string; label: string; roles: string[]; sig?: boolean; comment?: boolean }>
  ) {
    const entityId = entityMap[entityName]
    const lc = await prisma.ontologyLifecycle.create({
      data: { orgId: ORG_ID, entityId, name, isSystem: true },
    })

    const stateMap: Record<string, string> = {}
    for (let i = 0; i < states.length; i++) {
      const s = states[i]
      const st = await prisma.ontologyLifecycleState.create({
        data: {
          lifecycleId: lc.id,
          code: s.code,
          label: s.label,
          color: s.color,
          isInitial: s.isInitial ?? false,
          isTerminal: s.isTerminal ?? false,
          sortOrder: s.sortOrder ?? i,
        },
      })
      stateMap[s.code] = st.id
    }

    for (const t of transitions) {
      await prisma.ontologyLifecycleTransition.create({
        data: {
          lifecycleId: lc.id,
          fromStateId: stateMap[t.fromCode],
          toStateId: stateMap[t.toCode],
          action: t.action,
          label: t.label,
          requiredRoles: t.roles,
          requiresSignature: t.sig ?? false,
          requiresComment: t.comment ?? false,
          isSystem: true,
        },
      })
    }
  }

  // Batch Lifecycle
  await createLifecycle("batch", "Batch Lifecycle",
    [
      { code: "planned", label: "Planned", color: "#6b7280", isInitial: true },
      { code: "in_progress", label: "In Progress", color: "#1d4ed8" },
      { code: "on_hold", label: "On Hold", color: "#d97706" },
      { code: "under_review", label: "Under Review", color: "#7c3aed" },
      { code: "approved", label: "Approved", color: "#16a34a", isTerminal: true },
      { code: "rejected", label: "Rejected", color: "#dc2626", isTerminal: true },
    ],
    [
      { fromCode: "planned", toCode: "in_progress", action: "start", label: "Start Batch", roles: ["supervisor","production_head","admin"], sig: false },
      { fromCode: "in_progress", toCode: "on_hold", action: "hold", label: "Place on Hold", roles: ["admin","qa_reviewer","qa_head"], sig: true },
      { fromCode: "on_hold", toCode: "in_progress", action: "resume", label: "Resume Batch", roles: ["admin","qa_head"], sig: true },
      { fromCode: "in_progress", toCode: "under_review", action: "submit", label: "Submit for Review", roles: ["supervisor","production_head","admin"], sig: true },
      { fromCode: "under_review", toCode: "approved", action: "approve", label: "Approve Batch", roles: ["qa_head","admin"], sig: true },
      { fromCode: "under_review", toCode: "rejected", action: "reject", label: "Reject Batch", roles: ["qa_head","admin"], sig: true },
      { fromCode: "under_review", toCode: "in_progress", action: "return", label: "Return for Correction", roles: ["qa_reviewer","qa_head","admin"], sig: true },
    ]
  )

  // MBR Lifecycle
  await createLifecycle("mbr", "MBR Lifecycle",
    [
      { code: "draft", label: "Draft", color: "#6b7280", isInitial: true },
      { code: "pending_review", label: "Pending Review", color: "#7c3aed" },
      { code: "approved", label: "Approved", color: "#16a34a" },
      { code: "superseded", label: "Superseded", color: "#d97706", isTerminal: true },
      { code: "obsolete", label: "Obsolete", color: "#9ca3af", isTerminal: true },
    ],
    [
      { fromCode: "draft", toCode: "pending_review", action: "submit", label: "Submit for Review", roles: ["admin","production_head"], sig: true },
      { fromCode: "pending_review", toCode: "approved", action: "approve", label: "Approve MBR", roles: ["qa_head","admin"], sig: true },
      { fromCode: "pending_review", toCode: "draft", action: "reject", label: "Return to Draft", roles: ["qa_head","qa_reviewer","admin"], sig: false },
      { fromCode: "approved", toCode: "superseded", action: "supersede", label: "Mark as Superseded", roles: ["admin"], sig: true },
    ]
  )

  // Deviation Lifecycle
  await createLifecycle("deviation", "Deviation Lifecycle",
    [
      { code: "open", label: "Open", color: "#dc2626", isInitial: true },
      { code: "under_investigation", label: "Under Investigation", color: "#d97706" },
      { code: "pending_capa", label: "Pending CAPA", color: "#7c3aed" },
      { code: "closed", label: "Closed", color: "#16a34a", isTerminal: true },
    ],
    [
      { fromCode: "open", toCode: "under_investigation", action: "investigate", label: "Start Investigation", roles: ["qa_reviewer","qa_head","admin"], sig: false },
      { fromCode: "under_investigation", toCode: "pending_capa", action: "add_capa", label: "Add CAPA", roles: ["qa_reviewer","qa_head","admin"], sig: false },
      { fromCode: "pending_capa", toCode: "closed", action: "close", label: "Close Deviation", roles: ["qa_head","admin"], sig: true },
    ]
  )

  // Equipment Lifecycle
  await createLifecycle("equipment", "Equipment Lifecycle",
    [
      { code: "not_qualified", label: "Not Qualified", color: "#6b7280", isInitial: true },
      { code: "qualified", label: "Qualified", color: "#16a34a" },
      { code: "under_maintenance", label: "Under Maintenance", color: "#d97706" },
      { code: "decommissioned", label: "Decommissioned", color: "#9ca3af", isTerminal: true },
    ],
    [
      { fromCode: "not_qualified", toCode: "qualified", action: "qualify", label: "Mark as Qualified", roles: ["qa_head","admin"], sig: true },
      { fromCode: "qualified", toCode: "under_maintenance", action: "maintenance", label: "Send for Maintenance", roles: ["admin","supervisor"], sig: false },
      { fromCode: "under_maintenance", toCode: "qualified", action: "requalify", label: "Return to Qualified", roles: ["qa_head","admin"], sig: true },
      { fromCode: "qualified", toCode: "decommissioned", action: "decommission", label: "Decommission", roles: ["admin"], sig: true },
    ]
  )

  // CAPA Lifecycle
  await createLifecycle("capa", "CAPA Lifecycle",
    [
      { code: "pending", label: "Pending", color: "#d97706", isInitial: true },
      { code: "in_progress", label: "In Progress", color: "#1d4ed8" },
      { code: "completed", label: "Completed", color: "#16a34a" },
      { code: "verified", label: "Verified", color: "#16a34a", isTerminal: true },
    ],
    [
      { fromCode: "pending", toCode: "in_progress", action: "start", label: "Start CAPA", roles: ["qa_reviewer","qa_head","admin"], sig: false },
      { fromCode: "in_progress", toCode: "completed", action: "complete", label: "Mark Complete", roles: ["qa_reviewer","qa_head","admin"], sig: true },
      { fromCode: "completed", toCode: "verified", action: "verify", label: "Verify Effectiveness", roles: ["qa_head","admin"], sig: true },
    ]
  )

  console.log("Creating constraints...")

  // ─── CONSTRAINTS ──────────────────────────────────────────────
  type ConstraintDef = {
    entityName: string
    code: string
    name: string
    constraintType: string
    rule: object
    severity: string
    errorMessage: string
  }

  const constraints: ConstraintDef[] = [
    // batch
    { entityName: "batch", code: "batch_expiry_after_mfg", name: "Expiry After Manufacturing", constraintType: "cross_field", rule: { condition: "expiry_date > manufacturing_date" }, severity: "error", errorMessage: "Expiry date must be after manufacturing date" },
    { entityName: "batch", code: "batch_yield_range", name: "Yield Within Limits", constraintType: "range_check", rule: { field: "yield_percentage", min: 95, max: 105 }, severity: "warning", errorMessage: "Yield percentage is outside acceptable limits (95-105%)" },
    { entityName: "batch", code: "batch_mbr_approved", name: "MBR Must Be Approved", constraintType: "cross_entity", rule: { condition: "mbr.status = 'approved'" }, severity: "error", errorMessage: "Cannot create batch from a non-approved MBR" },
    { entityName: "batch", code: "batch_critical_hold", name: "Critical Deviation Auto-Hold", constraintType: "conditional", rule: { if: "deviation.severity = 'critical'", then: "batch.status = 'on_hold'" }, severity: "error", errorMessage: "Batch must be placed on hold when critical deviation is raised" },
    // equipment
    { entityName: "equipment", code: "equip_cal_not_expired", name: "Calibration Not Expired", constraintType: "temporal", rule: { condition: "calibration_due_date > NOW()" }, severity: "warning", errorMessage: "Equipment calibration is due or expired" },
    { entityName: "equipment", code: "equip_qualified_use", name: "Only Qualified Equipment", constraintType: "conditional", rule: { if: "used_in_batch", then: "status = 'qualified'" }, severity: "error", errorMessage: "Equipment must be qualified before use in batch" },
    // mbr
    { entityName: "mbr", code: "mbr_product_required", name: "Product Required", constraintType: "required_field", rule: { field: "product" }, severity: "error", errorMessage: "MBR must reference a product" },
    { entityName: "mbr", code: "mbr_min_one_step", name: "Minimum One Step", constraintType: "cross_entity", rule: { condition: "steps.count >= 1" }, severity: "error", errorMessage: "MBR must have at least one manufacturing step" },
    { entityName: "mbr", code: "mbr_yield_range_valid", name: "Valid Yield Range", constraintType: "cross_field", rule: { condition: "yield_limit_max > yield_limit_min" }, severity: "error", errorMessage: "Yield maximum must be greater than yield minimum" },
    // deviation
    { entityName: "deviation", code: "dev_capa_before_close", name: "CAPA Before Close", constraintType: "conditional", rule: { if: "status = 'closed'", then: "capa_status != null" }, severity: "error", errorMessage: "CAPA must be defined before closing a deviation" },
    { entityName: "deviation", code: "dev_root_cause_required", name: "Root Cause Before Close", constraintType: "conditional", rule: { if: "status = 'closed'", then: "root_cause != null" }, severity: "error", errorMessage: "Root cause must be documented before closing a deviation" },
    // product
    { entityName: "product", code: "product_code_unique", name: "Product Code Unique", constraintType: "unique_field", rule: { field: "product_code" }, severity: "error", errorMessage: "Product code must be unique within the organization" },
    { entityName: "product", code: "product_shelf_life_positive", name: "Positive Shelf Life", constraintType: "range_check", rule: { field: "shelf_life_months", min: 1, max: 120 }, severity: "error", errorMessage: "Shelf life must be between 1 and 120 months" },
    // raw_material
    { entityName: "raw_material", code: "material_code_unique", name: "Material Code Unique", constraintType: "unique_field", rule: { field: "material_code" }, severity: "error", errorMessage: "Material code must be unique within the organization" },
    { entityName: "raw_material", code: "material_assay_range", name: "Valid Assay Range", constraintType: "cross_field", rule: { condition: "assay_max >= assay_min" }, severity: "warning", errorMessage: "Assay maximum should be greater than minimum" },
    // area
    { entityName: "area", code: "area_code_unique", name: "Area Code Unique", constraintType: "unique_field", rule: { field: "area_code" }, severity: "error", errorMessage: "Area code must be unique within the organization" },
    // sop
    { entityName: "sop", code: "sop_version_positive", name: "Positive Version", constraintType: "range_check", rule: { field: "version", min: 1 }, severity: "error", errorMessage: "SOP version must be at least 1" },
    // batch_step
    { entityName: "batch_step", code: "step_number_positive", name: "Positive Step Number", constraintType: "range_check", rule: { field: "step_number", min: 1 }, severity: "error", errorMessage: "Step number must be at least 1" },
  ]

  for (const c of constraints) {
    await prisma.ontologyConstraint.create({
      data: {
        orgId: ORG_ID,
        entityId: entityMap[c.entityName],
        code: c.code,
        name: c.name,
        constraintType: c.constraintType,
        rule: c.rule,
        severity: c.severity,
        errorMessage: c.errorMessage,
        isSystem: true,
        isActive: true,
      },
    })
  }

  console.log("Creating process graph...")

  // ─── PROCESS GRAPH ────────────────────────────────────────────
  const graph = await prisma.processGraph.create({
    data: {
      orgId: ORG_ID,
      name: "Manufacturing Workflow",
      description: "End-to-end pharmaceutical manufacturing workflow from product to approved batch",
      isSystem: true,
    },
  })

  const nodeData = [
    { key: "product", label: "Product", nodeType: "entity" as const, entityId: entityMap["product"], posX: 50, posY: 200 },
    { key: "mbr", label: "Master Batch Record", nodeType: "entity" as const, entityId: entityMap["mbr"], posX: 250, posY: 200 },
    { key: "batch", label: "Batch", nodeType: "entity" as const, entityId: entityMap["batch"], posX: 450, posY: 200 },
    { key: "batch_step", label: "Batch Step", nodeType: "entity" as const, entityId: entityMap["batch_step"], posX: 450, posY: 350 },
    { key: "ipc_result", label: "IPC Result", nodeType: "entity" as const, entityId: entityMap["ipc_result"], posX: 650, posY: 350 },
    { key: "deviation", label: "Deviation", nodeType: "entity" as const, entityId: entityMap["deviation"], posX: 650, posY: 200 },
    { key: "batch_review", label: "Batch Review", nodeType: "entity" as const, entityId: entityMap["batch_review"], posX: 850, posY: 200 },
  ]

  const nodeMap: Record<string, string> = {}
  for (const n of nodeData) {
    const node = await prisma.processGraphNode.create({
      data: {
        graphId: graph.id,
        orgId: ORG_ID,
        label: n.label,
        nodeType: n.nodeType,
        entityId: n.entityId ?? null,
        posX: n.posX,
        posY: n.posY,
      },
    })
    nodeMap[n.key] = node.id
  }

  const edgeData = [
    { source: "product", target: "mbr", label: "has MBR" },
    { source: "mbr", target: "batch", label: "produces Batch" },
    { source: "batch", target: "batch_step", label: "has Steps" },
    { source: "batch_step", target: "ipc_result", label: "has IPC Results" },
    { source: "batch", target: "deviation", label: "has Deviations" },
    { source: "batch", target: "batch_review", label: "submitted for Review" },
  ]

  for (const e of edgeData) {
    await prisma.processGraphEdge.create({
      data: {
        graphId: graph.id,
        sourceNodeId: nodeMap[e.source],
        targetNodeId: nodeMap[e.target],
        label: e.label ?? null,
      },
    })
  }

  console.log("Ontology redesign seeded successfully!")
  console.log(`  Entities: ${entityDefs.length}`)
  console.log(`  Relationships: ${rels.length}`)
  console.log(`  Lifecycles: 5`)
  console.log(`  Constraints: ${constraints.length}`)
  console.log(`  Process graph nodes: ${nodeData.length}`)
  console.log(`  Process graph edges: ${edgeData.length}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
