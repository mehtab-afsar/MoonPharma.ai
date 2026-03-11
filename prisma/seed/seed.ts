/**
 * MoonPharma eBMR — Seed Script
 * Seeds the database with realistic pharma mock data.
 * Primary login: mehtabafsar346@gmail.com / Moon@123
 */

import { PrismaClient } from "../../src/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding MoonPharma eBMR database...")

  // ──────────────────────────────────────────────
  // 1. ORGANIZATION
  // ──────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { id: "org-moonpharma-01" },
    update: {},
    create: {
      id: "org-moonpharma-01",
      name: "MoonPharma Pvt. Ltd.",
      licenseNumber: "MFG-IN-2024-0042",
      address: "Plot 14, Pharma SEZ, Hyderabad, Telangana 500081, India",
      gmpCertificateNumber: "GMP-CDSCO-2024-0042",
      subscriptionPlan: "professional",
      isActive: true,
    },
  })
  console.log("✅ Organization created:", org.name)

  // ──────────────────────────────────────────────
  // 2. USERS (all roles + primary admin)
  // ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Moon@123", 12)
  const pinHash = await bcrypt.hash("1234", 12)

  const usersData = [
    {
      id: "user-admin-01",
      employeeId: "EMP001",
      fullName: "Mehtab Afsar",
      email: "mehtabafsar346@gmail.com",
      role: "admin" as const,
      department: "IT & Systems",
      designation: "System Administrator",
    },
    {
      id: "user-prodhead-01",
      employeeId: "EMP002",
      fullName: "Dr. Ravi Kumar",
      email: "ravi.kumar@moonpharma.com",
      role: "production_head" as const,
      department: "Manufacturing",
      designation: "Production Head",
    },
    {
      id: "user-supervisor-01",
      employeeId: "EMP003",
      fullName: "Priya Sharma",
      email: "priya.sharma@moonpharma.com",
      role: "supervisor" as const,
      department: "Manufacturing",
      designation: "Production Supervisor",
    },
    {
      id: "user-operator-01",
      employeeId: "EMP004",
      fullName: "Arjun Patel",
      email: "arjun.patel@moonpharma.com",
      role: "operator" as const,
      department: "Manufacturing",
      designation: "Production Operator",
    },
    {
      id: "user-operator-02",
      employeeId: "EMP005",
      fullName: "Sneha Reddy",
      email: "sneha.reddy@moonpharma.com",
      role: "operator" as const,
      department: "Manufacturing",
      designation: "Production Operator",
    },
    {
      id: "user-qareviewer-01",
      employeeId: "EMP006",
      fullName: "Kavita Nair",
      email: "kavita.nair@moonpharma.com",
      role: "qa_reviewer" as const,
      department: "Quality Assurance",
      designation: "QA Analyst",
    },
    {
      id: "user-qahead-01",
      employeeId: "EMP007",
      fullName: "Dr. Suresh Mehta",
      email: "suresh.mehta@moonpharma.com",
      role: "qa_head" as const,
      department: "Quality Assurance",
      designation: "QA Head",
    },
  ]

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        ...u,
        orgId: org.id,
        passwordHash,
        eSignaturePinHash: pinHash,
        isActive: true,
      },
    })
  }
  console.log("✅ Users created (7 users, all roles)")

  // ──────────────────────────────────────────────
  // 3. PRODUCTS
  // ──────────────────────────────────────────────
  const productsData = [
    {
      id: "prod-amox-500",
      productCode: "PRD-0001",
      productName: "Amoxicillin",
      genericName: "Amoxicillin Trihydrate",
      dosageForm: "Capsule" as const,
      strength: "500 mg",
      shelfLifeMonths: 24,
      storageConditions: "Store below 25°C, protect from moisture",
      regulatoryCategory: "Schedule H",
    },
    {
      id: "prod-metro-400",
      productCode: "PRD-0002",
      productName: "Metronidazole",
      genericName: "Metronidazole",
      dosageForm: "Tablet" as const,
      strength: "400 mg",
      shelfLifeMonths: 36,
      storageConditions: "Store below 30°C, protect from light",
      regulatoryCategory: "Schedule H",
    },
    {
      id: "prod-paracet-500",
      productCode: "PRD-0003",
      productName: "Paracetamol",
      genericName: "Paracetamol (Acetaminophen)",
      dosageForm: "Tablet" as const,
      strength: "500 mg",
      shelfLifeMonths: 36,
      storageConditions: "Store below 30°C",
      regulatoryCategory: "OTC",
    },
    {
      id: "prod-cipro-250",
      productCode: "PRD-0004",
      productName: "Ciprofloxacin",
      genericName: "Ciprofloxacin Hydrochloride",
      dosageForm: "Tablet" as const,
      strength: "250 mg",
      shelfLifeMonths: 30,
      storageConditions: "Store below 25°C",
      regulatoryCategory: "Schedule H1",
    },
  ]

  for (const p of productsData) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, orgId: org.id, isActive: true },
    })
  }
  console.log("✅ Products created (4 products)")

  // ──────────────────────────────────────────────
  // 4. MATERIALS
  // ──────────────────────────────────────────────
  const materialsData = [
    { id: "mat-amox-api", materialCode: "MAT-0001", materialName: "Amoxicillin Trihydrate", materialType: "active" as const, unitOfMeasure: "kg", pharmacoepialGrade: "BP" as const },
    { id: "mat-metro-api", materialCode: "MAT-0002", materialName: "Metronidazole API", materialType: "active" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-paracet-api", materialCode: "MAT-0003", materialName: "Paracetamol API", materialType: "active" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-cipro-api", materialCode: "MAT-0004", materialName: "Ciprofloxacin HCl API", materialType: "active" as const, unitOfMeasure: "kg", pharmacoepialGrade: "USP" as const },
    { id: "mat-mcc", materialCode: "MAT-0005", materialName: "Microcrystalline Cellulose (MCC)", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-lactose", materialCode: "MAT-0006", materialName: "Lactose Monohydrate", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "BP" as const },
    { id: "mat-starch", materialCode: "MAT-0007", materialName: "Maize Starch", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-mg-stearate", materialCode: "MAT-0008", materialName: "Magnesium Stearate", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-pvp", materialCode: "MAT-0009", materialName: "Polyvinylpyrrolidone K30 (PVP K30)", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "USP" as const },
    { id: "mat-talc", materialCode: "MAT-0010", materialName: "Talc (Purified)", materialType: "excipient" as const, unitOfMeasure: "kg", pharmacoepialGrade: "IP" as const },
    { id: "mat-caps", materialCode: "MAT-0011", materialName: "Hard Gelatin Capsules Size 1", materialType: "packaging" as const, unitOfMeasure: "units", pharmacoepialGrade: null },
    { id: "mat-blister", materialCode: "MAT-0012", materialName: "Aluminium Foil Blister", materialType: "packaging" as const, unitOfMeasure: "m2", pharmacoepialGrade: null },
    { id: "mat-bottle", materialCode: "MAT-0013", materialName: "HDPE Bottle 100ml", materialType: "packaging" as const, unitOfMeasure: "units", pharmacoepialGrade: null },
    { id: "mat-ipa", materialCode: "MAT-0014", materialName: "Isopropyl Alcohol 70%", materialType: "consumable" as const, unitOfMeasure: "L", pharmacoepialGrade: "IP" as const },
    { id: "mat-purwater", materialCode: "MAT-0015", materialName: "Purified Water", materialType: "consumable" as const, unitOfMeasure: "L", pharmacoepialGrade: "IP" as const },
  ]

  for (const m of materialsData) {
    await prisma.material.upsert({
      where: { id: m.id },
      update: {},
      create: { ...m, orgId: org.id, isActive: true },
    })
  }
  console.log("✅ Materials created (15 materials)")

  // ──────────────────────────────────────────────
  // 5. EQUIPMENT
  // ──────────────────────────────────────────────
  const equipmentData = [
    { id: "eq-blender-01", equipmentCode: "EQ-BL-001", equipmentName: "Octagonal Blender", equipmentType: "Blender", location: "Manufacturing Floor A", capacity: "200 kg", status: "available" as const, lastCalibrationDate: new Date("2025-10-01"), nextCalibrationDate: new Date("2026-04-01") },
    { id: "eq-granulator-01", equipmentCode: "EQ-GR-001", equipmentName: "Rapid Mixer Granulator", equipmentType: "Granulator", location: "Manufacturing Floor A", capacity: "150 kg", status: "available" as const, lastCalibrationDate: new Date("2025-09-15"), nextCalibrationDate: new Date("2026-03-15") },
    { id: "eq-dryer-01", equipmentCode: "EQ-FBD-001", equipmentName: "Fluid Bed Dryer", equipmentType: "Dryer", location: "Manufacturing Floor A", capacity: "100 kg", status: "available" as const, lastCalibrationDate: new Date("2025-11-01"), nextCalibrationDate: new Date("2026-05-01") },
    { id: "eq-tablet-01", equipmentCode: "EQ-TC-001", equipmentName: "Rotary Tablet Compression Machine", equipmentType: "Tablet Press", location: "Manufacturing Floor B", capacity: "200,000 tabs/hr", status: "available" as const, lastCalibrationDate: new Date("2025-10-15"), nextCalibrationDate: new Date("2026-04-15") },
    { id: "eq-capsule-01", equipmentCode: "EQ-CF-001", equipmentName: "Capsule Filling Machine", equipmentType: "Capsule Filler", location: "Manufacturing Floor B", capacity: "60,000 caps/hr", status: "in_use" as const, lastCalibrationDate: new Date("2025-08-01"), nextCalibrationDate: new Date("2026-02-01") },
    { id: "eq-coater-01", equipmentCode: "EQ-FC-001", equipmentName: "Film Coating Pan", equipmentType: "Coating Pan", location: "Manufacturing Floor B", capacity: "100 kg", status: "available" as const, lastCalibrationDate: new Date("2025-12-01"), nextCalibrationDate: new Date("2026-06-01") },
    { id: "eq-balance-01", equipmentCode: "EQ-BAL-001", equipmentName: "Analytical Balance (0.0001g)", equipmentType: "Balance", location: "Dispensing Area", capacity: "220g", status: "available" as const, lastCalibrationDate: new Date("2026-01-01"), nextCalibrationDate: new Date("2026-07-01") },
    { id: "eq-balance-02", equipmentCode: "EQ-BAL-002", equipmentName: "Platform Balance (10kg)", equipmentType: "Balance", location: "Dispensing Area", capacity: "10 kg", status: "available" as const, lastCalibrationDate: new Date("2026-01-01"), nextCalibrationDate: new Date("2026-07-01") },
  ]

  for (const e of equipmentData) {
    await prisma.equipment.upsert({
      where: { id: e.id },
      update: {},
      create: { ...e, orgId: org.id, isActive: true },
    })
  }
  console.log("✅ Equipment created (8 pieces)")

  // ──────────────────────────────────────────────
  // 6. MASTER BATCH RECORD — Amoxicillin 500mg
  // ──────────────────────────────────────────────
  const mbr = await prisma.masterBatchRecord.upsert({
    where: { id: "mbr-amox-500-v1" },
    update: {},
    create: {
      id: "mbr-amox-500-v1",
      orgId: org.id,
      productId: "prod-amox-500",
      mbrCode: "MBR-AMOX-500",
      version: 1,
      batchSizeValue: 100,
      batchSizeUnit: "kg",
      theoreticalYieldValue: 200000,
      theoreticalYieldUnit: "capsules",
      yieldLimitMin: 95.00,
      yieldLimitMax: 100.00,
      effectiveDate: new Date("2024-01-15"),
      reviewDate: new Date("2026-01-15"),
      status: "approved",
      createdById: "user-prodhead-01",
      approvedById: "user-qahead-01",
      approvedAt: new Date("2024-01-15"),
    },
  })

  // 6a. MBR Materials BOM
  const mbrMaterialsData = [
    { id: "mbr-mat-01", mbrId: mbr.id, materialId: "mat-amox-api", quantity: 55.5, unit: "kg", tolerancePlus: 2, toleranceMinus: 2, stage: "Dispensing", sequenceOrder: 1, isCritical: true, instructions: "Weigh accurately using calibrated platform balance" },
    { id: "mbr-mat-02", mbrId: mbr.id, materialId: "mat-mcc", quantity: 25.0, unit: "kg", tolerancePlus: 1, toleranceMinus: 1, stage: "Dispensing", sequenceOrder: 2, isCritical: false, instructions: "Weigh in dispensing area" },
    { id: "mbr-mat-03", mbrId: mbr.id, materialId: "mat-lactose", quantity: 12.0, unit: "kg", tolerancePlus: 1, toleranceMinus: 1, stage: "Dispensing", sequenceOrder: 3, isCritical: false, instructions: "Weigh in dispensing area" },
    { id: "mbr-mat-04", mbrId: mbr.id, materialId: "mat-pvp", quantity: 3.5, unit: "kg", tolerancePlus: 0.5, toleranceMinus: 0.5, stage: "Granulation", sequenceOrder: 4, isCritical: false, instructions: "Dissolve in purified water before use" },
    { id: "mbr-mat-05", mbrId: mbr.id, materialId: "mat-mg-stearate", quantity: 1.0, unit: "kg", tolerancePlus: 0.1, toleranceMinus: 0.1, stage: "Blending", sequenceOrder: 5, isCritical: true, instructions: "Weigh accurately — critical for lubrication" },
    { id: "mbr-mat-06", mbrId: mbr.id, materialId: "mat-talc", quantity: 1.5, unit: "kg", tolerancePlus: 0.2, toleranceMinus: 0.2, stage: "Blending", sequenceOrder: 6, isCritical: false, instructions: "Sift through 60 mesh before use" },
    { id: "mbr-mat-07", mbrId: mbr.id, materialId: "mat-caps", quantity: 200000, unit: "units", tolerancePlus: 500, toleranceMinus: 0, stage: "Encapsulation", sequenceOrder: 7, isCritical: false, instructions: "Check capsule size 1 before use" },
    { id: "mbr-mat-08", mbrId: mbr.id, materialId: "mat-purwater", quantity: 15.0, unit: "L", tolerancePlus: 1, toleranceMinus: 1, stage: "Granulation", sequenceOrder: 8, isCritical: false, instructions: "Use freshly prepared purified water" },
  ]

  for (const m of mbrMaterialsData) {
    await prisma.mBRMaterial.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    })
  }

  // 6b. MBR Steps (10 steps)
  const stepsData = [
    { id: "step-01", mbrId: mbr.id, stepNumber: 1, stepName: "Line Clearance & Area Preparation", stage: "Preparation", instructions: "Verify that the manufacturing area is clean and free from any previous batch materials. Check area temperature and relative humidity. Verify all equipment is clean and properly calibrated. Obtain line clearance certificate signed by QA.", equipmentType: "General Area", estimatedDurationMinutes: 30, requiresLineClearance: true, requiresEnvironmentalCheck: true, envTempMin: 20, envTempMax: 25, envHumidityMin: 40, envHumidityMax: 60 },
    { id: "step-02", mbrId: mbr.id, stepNumber: 2, stepName: "Dispensing of Raw Materials", stage: "Dispensing", instructions: "Dispense all raw materials as per the Bill of Materials. Use calibrated balances. Each weighing must be verified by a second person. Record AR numbers and supplier batch numbers for all materials.", equipmentType: "Balance", estimatedDurationMinutes: 60, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-03", mbrId: mbr.id, stepNumber: 3, stepName: "Dry Mixing (Pre-Granulation)", stage: "Granulation", instructions: "Transfer Amoxicillin Trihydrate, MCC, and Lactose Monohydrate into the Rapid Mixer Granulator. Mix at slow speed for 5 minutes. Check blend uniformity visually.", equipmentType: "Granulator", estimatedDurationMinutes: 20, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-04", mbrId: mbr.id, stepNumber: 4, stepName: "Wet Granulation", stage: "Granulation", instructions: "Prepare binder solution by dissolving PVP K30 in purified water. Add binder solution slowly to the dry mix in RMG while mixing. Continue granulation until wet mass is formed. Assess end point by squeeze test.", equipmentType: "Granulator", estimatedDurationMinutes: 45, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-05", mbrId: mbr.id, stepNumber: 5, stepName: "Drying (Fluid Bed Drying)", stage: "Drying", instructions: "Transfer the wet granules to Fluid Bed Dryer. Dry at inlet air temperature 55-60°C until LOD ≤ 2.0%. Sample every 30 minutes and record LOD values. Stop drying when target LOD is achieved.", equipmentType: "Dryer", estimatedDurationMinutes: 180, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-06", mbrId: mbr.id, stepNumber: 6, stepName: "Milling & Sizing", stage: "Milling", instructions: "Mill the dried granules through 20 mesh screen. Collect milled granules and record weight. Calculate yield of milling stage.", equipmentType: "Mill", estimatedDurationMinutes: 30, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-07", mbrId: mbr.id, stepNumber: 7, stepName: "Lubrication & Final Blending", stage: "Blending", instructions: "Sift Magnesium Stearate and Talc through 60 mesh. Add to milled granules in Octagonal Blender. Mix for exactly 5 minutes at recommended speed. Do not over-blend — critical step.", equipmentType: "Blender", estimatedDurationMinutes: 25, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-08", mbrId: mbr.id, stepNumber: 8, stepName: "Encapsulation", stage: "Encapsulation", instructions: "Transfer final blend to Capsule Filling Machine. Set target fill weight to 500mg ± 5%. Perform weight variation checks every 30 minutes. Fill capsules into approved size 1 hard gelatin capsules.", equipmentType: "Capsule Filler", estimatedDurationMinutes: 240, requiresLineClearance: false, requiresEnvironmentalCheck: true, envTempMin: 20, envTempMax: 25, envHumidityMin: 40, envHumidityMax: 55 },
    { id: "step-09", mbrId: mbr.id, stepNumber: 9, stepName: "In-Process Quality Checks", stage: "Quality Check", instructions: "Perform in-process quality checks: weight variation, disintegration time, visual inspection for defects. Record all results. Any out-of-specification result must be investigated immediately.", equipmentType: "Balance", estimatedDurationMinutes: 60, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
    { id: "step-10", mbrId: mbr.id, stepNumber: 10, stepName: "Yield Calculation & Batch Completion", stage: "Completion", instructions: "Count total capsules produced. Calculate theoretical yield, actual yield, and percentage yield. Record all batch details. Collect retained samples. Transfer to QA for batch record review.", equipmentType: "General Area", estimatedDurationMinutes: 30, requiresLineClearance: false, requiresEnvironmentalCheck: false, envTempMin: null, envTempMax: null, envHumidityMin: null, envHumidityMax: null },
  ]

  for (const s of stepsData) {
    await prisma.mBRStep.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    })
  }

  // 6c. Step Parameters
  const parametersData = [
    { id: "param-01-01", mbrStepId: "step-01", parameterName: "Area Temperature (°C)", parameterType: "numeric" as const, unit: "°C", minValue: 20, maxValue: 25, isCritical: true, sequenceOrder: 1, targetValue: undefined, selectionOptions: undefined },
    { id: "param-01-02", mbrStepId: "step-01", parameterName: "Relative Humidity (%)", parameterType: "numeric" as const, unit: "%", minValue: 40, maxValue: 60, isCritical: true, sequenceOrder: 2, targetValue: undefined, selectionOptions: undefined },
    { id: "param-01-03", mbrStepId: "step-01", parameterName: "Line Clearance Certificate No.", parameterType: "text" as const, isCritical: true, sequenceOrder: 3, unit: null, minValue: undefined, maxValue: undefined, targetValue: undefined, selectionOptions: undefined },
    { id: "param-03-01", mbrStepId: "step-03", parameterName: "Mixing Speed", parameterType: "selection" as const, selectionOptions: ["Slow (180 rpm)", "Medium (280 rpm)", "Fast (380 rpm)"], targetValue: "Slow (180 rpm)", isCritical: false, sequenceOrder: 1, unit: null, minValue: undefined, maxValue: undefined },
    { id: "param-03-02", mbrStepId: "step-03", parameterName: "Mixing Time (minutes)", parameterType: "numeric" as const, unit: "min", minValue: 4, maxValue: 6, targetValue: "5", isCritical: false, sequenceOrder: 2, selectionOptions: undefined },
    { id: "param-04-01", mbrStepId: "step-04", parameterName: "Binder Solution Temperature (°C)", parameterType: "numeric" as const, unit: "°C", minValue: 25, maxValue: 35, isCritical: false, sequenceOrder: 1, targetValue: undefined, selectionOptions: undefined },
    { id: "param-04-02", mbrStepId: "step-04", parameterName: "Granulation End Point", parameterType: "selection" as const, selectionOptions: ["Satisfactory", "Unsatisfactory"], targetValue: "Satisfactory", isCritical: true, sequenceOrder: 2, unit: null, minValue: undefined, maxValue: undefined },
    { id: "param-05-01", mbrStepId: "step-05", parameterName: "Inlet Air Temperature (°C)", parameterType: "numeric" as const, unit: "°C", minValue: 55, maxValue: 65, isCritical: true, sequenceOrder: 1, targetValue: undefined, selectionOptions: undefined },
    { id: "param-05-02", mbrStepId: "step-05", parameterName: "Final LOD (%)", parameterType: "numeric" as const, unit: "%", minValue: 0, maxValue: 2.0, isCritical: true, sequenceOrder: 2, targetValue: undefined, selectionOptions: undefined },
    { id: "param-05-03", mbrStepId: "step-05", parameterName: "Drying Time (minutes)", parameterType: "numeric" as const, unit: "min", isCritical: false, sequenceOrder: 3, targetValue: undefined, minValue: undefined, maxValue: undefined, selectionOptions: undefined },
    { id: "param-07-01", mbrStepId: "step-07", parameterName: "Blending Time (minutes)", parameterType: "numeric" as const, unit: "min", minValue: 4, maxValue: 6, targetValue: "5", isCritical: true, sequenceOrder: 1, selectionOptions: undefined },
    { id: "param-07-02", mbrStepId: "step-07", parameterName: "Blender Speed (rpm)", parameterType: "numeric" as const, unit: "rpm", minValue: 8, maxValue: 12, isCritical: false, sequenceOrder: 2, targetValue: undefined, selectionOptions: undefined },
    { id: "param-08-01", mbrStepId: "step-08", parameterName: "Target Fill Weight (mg)", parameterType: "numeric" as const, unit: "mg", minValue: 475, maxValue: 525, targetValue: "500", isCritical: true, sequenceOrder: 1, selectionOptions: undefined },
    { id: "param-08-02", mbrStepId: "step-08", parameterName: "Area Temperature (°C)", parameterType: "numeric" as const, unit: "°C", minValue: 20, maxValue: 25, isCritical: true, sequenceOrder: 2, targetValue: undefined, selectionOptions: undefined },
    { id: "param-08-03", mbrStepId: "step-08", parameterName: "Area Humidity (%)", parameterType: "numeric" as const, unit: "%", minValue: 40, maxValue: 55, isCritical: true, sequenceOrder: 3, targetValue: undefined, selectionOptions: undefined },
    { id: "param-10-01", mbrStepId: "step-10", parameterName: "Total Capsules Filled (units)", parameterType: "numeric" as const, unit: "units", isCritical: true, sequenceOrder: 1, targetValue: undefined, minValue: undefined, maxValue: undefined, selectionOptions: undefined },
    { id: "param-10-02", mbrStepId: "step-10", parameterName: "Percentage Yield (%)", parameterType: "numeric" as const, unit: "%", minValue: 95, maxValue: 100, isCritical: true, sequenceOrder: 2, targetValue: undefined, selectionOptions: undefined },
    { id: "param-10-03", mbrStepId: "step-10", parameterName: "Retained Sample Quantity", parameterType: "text" as const, isCritical: false, sequenceOrder: 3, unit: null, minValue: undefined, maxValue: undefined, targetValue: undefined, selectionOptions: undefined },
  ]

  for (const p of parametersData) {
    await prisma.mBRStepParameter.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }

  // 6d. IPC Checks
  const ipcChecksData = [
    { id: "ipc-05-01", mbrStepId: "step-05", checkName: "LOD at 30 min", checkType: "numeric" as const, unit: "%", specification: "Record value", sequenceOrder: 1, isCritical: false, frequency: "Every 30 minutes", sampleSize: null, targetValue: undefined, minValue: undefined, maxValue: undefined },
    { id: "ipc-05-02", mbrStepId: "step-05", checkName: "LOD at 60 min", checkType: "numeric" as const, unit: "%", specification: "Record value", sequenceOrder: 2, isCritical: false, frequency: "Every 30 minutes", sampleSize: null, targetValue: undefined, minValue: undefined, maxValue: undefined },
    { id: "ipc-05-03", mbrStepId: "step-05", checkName: "Final LOD", checkType: "numeric" as const, unit: "%", specification: "NMT 2.0%", minValue: 0, maxValue: 2.0, sequenceOrder: 3, isCritical: true, frequency: "Final", sampleSize: null, targetValue: undefined },
    { id: "ipc-08-01", mbrStepId: "step-08", checkName: "Average Weight of 20 Capsules", checkType: "numeric" as const, unit: "mg", specification: "500 mg ± 5%", minValue: 475, maxValue: 525, sequenceOrder: 1, isCritical: true, frequency: "Every 30 minutes", sampleSize: "20 capsules", targetValue: undefined },
    { id: "ipc-08-02", mbrStepId: "step-08", checkName: "Individual Weight Variation", checkType: "pass_fail" as const, specification: "Within ±7.5% of average", sequenceOrder: 2, isCritical: true, frequency: "Every 30 minutes", sampleSize: "20 capsules", unit: null, minValue: undefined, maxValue: undefined, targetValue: undefined },
    { id: "ipc-08-03", mbrStepId: "step-08", checkName: "Visual Inspection (Defects)", checkType: "pass_fail" as const, specification: "No visible defects, ≤0.1% AQL", sequenceOrder: 3, isCritical: false, frequency: "Every 30 minutes", sampleSize: "100 capsules", unit: null, minValue: undefined, maxValue: undefined, targetValue: undefined },
    { id: "ipc-09-01", mbrStepId: "step-09", checkName: "Disintegration Time", checkType: "numeric" as const, unit: "min", specification: "NMT 30 minutes", maxValue: 30, sequenceOrder: 1, isCritical: true, frequency: "Once per batch", sampleSize: "6 capsules", targetValue: undefined, minValue: undefined },
    { id: "ipc-09-02", mbrStepId: "step-09", checkName: "Appearance — Color", checkType: "pass_fail" as const, specification: "White/Off-white, uniform", sequenceOrder: 2, isCritical: false, frequency: "Once per batch", sampleSize: null, unit: null, minValue: undefined, maxValue: undefined, targetValue: undefined },
  ]

  for (const c of ipcChecksData) {
    await prisma.mBRInProcessCheck.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }
  console.log("✅ MBR created: Amoxicillin 500mg (10 steps, 18 params, 8 IPC checks)")

  // ──────────────────────────────────────────────
  // 7. ADDITIONAL MBRs
  // ──────────────────────────────────────────────
  await prisma.masterBatchRecord.upsert({
    where: { id: "mbr-metro-400-v1" },
    update: {},
    create: {
      id: "mbr-metro-400-v1",
      orgId: org.id,
      productId: "prod-metro-400",
      mbrCode: "MBR-METRO-400",
      version: 1,
      batchSizeValue: 100,
      batchSizeUnit: "kg",
      theoreticalYieldValue: 250000,
      theoreticalYieldUnit: "tablets",
      yieldLimitMin: 95.00,
      yieldLimitMax: 100.00,
      effectiveDate: new Date("2024-03-01"),
      status: "approved",
      createdById: "user-prodhead-01",
      approvedById: "user-qahead-01",
      approvedAt: new Date("2024-03-01"),
    },
  })

  await prisma.masterBatchRecord.upsert({
    where: { id: "mbr-paracet-500-v1" },
    update: {},
    create: {
      id: "mbr-paracet-500-v1",
      orgId: org.id,
      productId: "prod-paracet-500",
      mbrCode: "MBR-PARA-500",
      version: 1,
      batchSizeValue: 200,
      batchSizeUnit: "kg",
      theoreticalYieldValue: 400000,
      theoreticalYieldUnit: "tablets",
      yieldLimitMin: 95.00,
      yieldLimitMax: 100.00,
      status: "pending_review",
      createdById: "user-prodhead-01",
    },
  })
  console.log("✅ Additional MBRs created (Metronidazole approved, Paracetamol pending)")

  // ──────────────────────────────────────────────
  // 8. BATCHES
  // ──────────────────────────────────────────────
  const batch1 = await prisma.batch.upsert({
    where: { batchNumber: "BN-2026-0001" },
    update: {},
    create: {
      id: "batch-001",
      orgId: org.id,
      mbrId: mbr.id,
      batchNumber: "BN-2026-0001",
      manufacturingDate: new Date("2026-03-01"),
      expiryDate: new Date("2028-03-01"),
      status: "in_progress",
      currentStepNumber: 3,
      startedAt: new Date("2026-03-01T08:00:00Z"),
      initiatedById: "user-supervisor-01",
    },
  })

  const batch2 = await prisma.batch.upsert({
    where: { batchNumber: "BN-2026-0002" },
    update: {},
    create: {
      id: "batch-002",
      orgId: org.id,
      mbrId: mbr.id,
      batchNumber: "BN-2026-0002",
      manufacturingDate: new Date("2026-02-15"),
      expiryDate: new Date("2028-02-15"),
      status: "under_review",
      currentStepNumber: 10,
      startedAt: new Date("2026-02-15T08:00:00Z"),
      completedAt: new Date("2026-02-16T18:00:00Z"),
      actualYieldValue: 196500,
      actualYieldUnit: "capsules",
      yieldPercentage: 98.25,
      initiatedById: "user-supervisor-01",
    },
  })

  const batch3 = await prisma.batch.upsert({
    where: { batchNumber: "BN-2026-0003" },
    update: {},
    create: {
      id: "batch-003",
      orgId: org.id,
      mbrId: mbr.id,
      batchNumber: "BN-2026-0003",
      manufacturingDate: new Date("2026-01-20"),
      expiryDate: new Date("2028-01-20"),
      status: "approved",
      currentStepNumber: 10,
      startedAt: new Date("2026-01-20T08:00:00Z"),
      completedAt: new Date("2026-01-21T17:00:00Z"),
      actualYieldValue: 198000,
      actualYieldUnit: "capsules",
      yieldPercentage: 99.0,
      initiatedById: "user-supervisor-01",
    },
  })

  await prisma.batch.upsert({
    where: { batchNumber: "BN-2026-0004" },
    update: {},
    create: {
      id: "batch-004",
      orgId: org.id,
      mbrId: mbr.id,
      batchNumber: "BN-2026-0004",
      manufacturingDate: new Date("2026-03-10"),
      expiryDate: new Date("2028-03-10"),
      status: "planned",
      currentStepNumber: 0,
      initiatedById: "user-supervisor-01",
    },
  })
  console.log("✅ Batches created (4 batches: 1 in-progress, 1 under-review, 1 approved, 1 planned)")

  // ──────────────────────────────────────────────
  // 9. DEVIATIONS
  // ──────────────────────────────────────────────
  await prisma.deviation.upsert({
    where: { deviationNumber: "DEV-2026-0001" },
    update: {},
    create: {
      id: "dev-001",
      orgId: org.id,
      batchId: batch2.id,
      deviationNumber: "DEV-2026-0001",
      deviationType: "unplanned",
      category: "process",
      severity: "minor",
      description: "LOD value at 60 min drying was 2.8% against specification of NMT 2.0%. Extended drying for additional 30 minutes.",
      rootCause: "Initial granule particle size was larger than expected due to high moisture content of API.",
      impactAssessment: "No significant impact on product quality. Final LOD achieved within specification after extended drying.",
      correctiveAction: "Extended drying time by 30 minutes. Final LOD confirmed at 1.8% before proceeding.",
      preventiveAction: "Review incoming API moisture specifications. Add pre-drying step if API moisture exceeds 3.0%.",
      status: "closed",
      raisedById: "user-operator-01",
      raisedAt: new Date("2026-02-15T14:30:00Z"),
      resolvedById: "user-supervisor-01",
      resolvedAt: new Date("2026-02-15T17:00:00Z"),
      approvedById: "user-qareviewer-01",
      approvedAt: new Date("2026-02-15T18:00:00Z"),
    },
  })

  await prisma.deviation.upsert({
    where: { deviationNumber: "DEV-2026-0002" },
    update: {},
    create: {
      id: "dev-002",
      orgId: org.id,
      batchId: batch1.id,
      deviationNumber: "DEV-2026-0002",
      deviationType: "unplanned",
      category: "equipment",
      severity: "major",
      description: "Capsule filling machine stopped unexpectedly during encapsulation due to a mechanical jam. Machine was offline for 45 minutes.",
      rootCause: "Under investigation",
      impactAssessment: "Under investigation",
      status: "under_investigation",
      raisedById: "user-operator-01",
      raisedAt: new Date("2026-03-02T11:00:00Z"),
    },
  })

  await prisma.deviation.upsert({
    where: { deviationNumber: "DEV-2026-0003" },
    update: {},
    create: {
      id: "dev-003",
      orgId: org.id,
      batchId: batch1.id,
      deviationNumber: "DEV-2026-0003",
      deviationType: "unplanned",
      category: "environmental",
      severity: "minor",
      description: "Encapsulation area RH was found at 57% against the specification of 40-55% for a period of approximately 20 minutes.",
      status: "open",
      raisedById: "user-supervisor-01",
      raisedAt: new Date("2026-03-02T14:00:00Z"),
    },
  })
  console.log("✅ Deviations created (3: closed, under-investigation, open)")

  // ──────────────────────────────────────────────
  // 10. BATCH REVIEWS
  // ──────────────────────────────────────────────
  await prisma.batchReview.upsert({
    where: { id: "review-002-qa" },
    update: {},
    create: {
      id: "review-002-qa",
      batchId: batch2.id,
      reviewType: "qa_review",
      reviewerId: "user-qareviewer-01",
      status: "in_progress",
      startedAt: new Date("2026-02-17T09:00:00Z"),
      comments: "Batch record received for review. Initial check in progress.",
    },
  })

  await prisma.batchReview.upsert({
    where: { id: "review-003-qa" },
    update: {},
    create: {
      id: "review-003-qa",
      batchId: batch3.id,
      reviewType: "qa_review",
      reviewerId: "user-qareviewer-01",
      status: "approved",
      startedAt: new Date("2026-01-22T09:00:00Z"),
      completedAt: new Date("2026-01-22T16:00:00Z"),
      comments: "All records are complete. No critical deviations. Yield within specification.",
    },
  })

  await prisma.batchReview.upsert({
    where: { id: "review-003-head" },
    update: {},
    create: {
      id: "review-003-head",
      batchId: batch3.id,
      reviewType: "qa_head_approval",
      reviewerId: "user-qahead-01",
      status: "approved",
      startedAt: new Date("2026-01-23T10:00:00Z"),
      completedAt: new Date("2026-01-23T11:00:00Z"),
      comments: "Batch approved for release. All specifications met.",
    },
  })
  console.log("✅ Batch reviews created")

  // ──────────────────────────────────────────────
  // 11. AUDIT TRAIL (sample entries)
  // ──────────────────────────────────────────────
  const auditEntries = [
    { orgId: org.id, userId: "user-admin-01", userName: "Mehtab Afsar", userRole: "admin", action: "LOGIN" as const, tableName: "users", recordId: "user-admin-01" },
    { orgId: org.id, userId: "user-prodhead-01", userName: "Dr. Ravi Kumar", userRole: "production_head", action: "CREATE" as const, tableName: "master_batch_records", recordId: "mbr-amox-500-v1" },
    { orgId: org.id, userId: "user-qahead-01", userName: "Dr. Suresh Mehta", userRole: "qa_head", action: "SIGN" as const, tableName: "master_batch_records", recordId: "mbr-amox-500-v1" },
    { orgId: org.id, userId: "user-supervisor-01", userName: "Priya Sharma", userRole: "supervisor", action: "CREATE" as const, tableName: "batches", recordId: "batch-001" },
    { orgId: org.id, userId: "user-operator-01", userName: "Arjun Patel", userRole: "operator", action: "CREATE" as const, tableName: "deviations", recordId: "dev-002" },
  ]

  for (const entry of auditEntries) {
    await prisma.auditTrail.create({ data: entry })
  }
  console.log("✅ Audit trail seeded (5 entries)")

  console.log("\n🎉 Seed complete!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("Login credentials:")
  console.log("  Admin:           mehtabafsar346@gmail.com / Moon@123")
  console.log("  QA Head:         suresh.mehta@moonpharma.com / Moon@123")
  console.log("  QA Reviewer:     kavita.nair@moonpharma.com / Moon@123")
  console.log("  Production Head: ravi.kumar@moonpharma.com / Moon@123")
  console.log("  Supervisor:      priya.sharma@moonpharma.com / Moon@123")
  console.log("  Operator:        arjun.patel@moonpharma.com / Moon@123")
  console.log("  E-signature PIN: 1234 (all users)")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
