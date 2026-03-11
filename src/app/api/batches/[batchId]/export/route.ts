import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getBatchById } from "@/server/services/batch.server"

// ─────────────────────────────────────────────
// Local shape types (export view only)
// ─────────────────────────────────────────────

interface ExportPerson {
  fullName?: string | null
  employeeId?: string | null
}

interface ExportUser {
  fullName?: string | null
  email?: string | null
}

interface ExportProduct {
  productName?: string | null
  dosageForm?: string | null
  strength?: string | null
}

interface ExportMbr {
  mbrCode?: string | null
  version?: number | null
  batchSizeValue?: number | null
  batchSizeUnit?: string | null
  theoreticalYield?: number | null
  product?: ExportProduct | null
}

interface ExportMbrMaterial {
  tolerancePlus?: number | null
  toleranceMinus?: number | null
}

interface ExportMaterial {
  materialName?: string | null
  name?: string | null
  materialType?: string | null
  unit?: string | null
}

interface ExportBatchMaterial {
  mbrMaterial?: ExportMbrMaterial | null
  material?: ExportMaterial | null
  requiredQuantity?: number | null
  actualQuantity?: number | null
  isWithinTolerance?: boolean | null
  arNumber?: string | null
  supplierBatchNumber?: string | null
  dispensedBy?: ExportPerson | null
  dispensedAt?: Date | string | null
  verifiedBy?: ExportPerson | null
  verifiedAt?: Date | string | null
}

interface ExportMbrParameter {
  minValue?: number | null
  maxValue?: number | null
  unit?: string | null
}

interface ExportParameter {
  parameterName: string
  actualValue?: string | number | null
  isWithinLimit?: boolean | null
  recordedAt?: Date | string | null
  mbrParameter?: ExportMbrParameter | null
}

interface ExportMbrIpc {
  minValue?: number | null
  maxValue?: number | null
  unit?: string | null
  acceptanceCriteria?: string | null
}

interface ExportIpcResult {
  checkName: string
  checkTime?: Date | string | null
  resultValue?: string | number | null
  isWithinSpec?: boolean | null
  remarks?: string | null
  mbrIpc?: ExportMbrIpc | null
}

interface ExportStepDeviation {
  deviationNumber?: string | null
  severity?: string | null
  status?: string | null
}

interface ExportMbrStep {
  stepName?: string | null
  stage?: string | null
  instructions?: string | null
}

interface ExportEquipment {
  equipmentName?: string | null
  equipmentCode?: string | null
}

interface ExportStep {
  stepNumber?: number | null
  stepName?: string | null
  status: string
  mbrStep?: ExportMbrStep | null
  performedBy?: ExportPerson | null
  verifiedBy?: ExportPerson | null
  startedAt?: Date | string | null
  completedAt?: Date | string | null
  equipment?: ExportEquipment | null
  envTemperature?: number | null
  envHumidity?: number | null
  remarks?: string | null
  areaCleanVerified?: boolean | null
  equipmentCleanVerified?: boolean | null
  parameters?: ExportParameter[]
  ipcResults?: ExportIpcResult[]
  deviations?: ExportStepDeviation[]
}

interface ExportDeviation {
  deviationNumber?: string | null
  raisedAt?: Date | string | null
  severity?: string | null
  status?: string | null
  description?: string | null
  rootCause?: string | null
  correctiveAction?: string | null
  raisedBy?: ExportPerson | null
}

interface ExportBatch {
  batchNumber: string
  mbr?: ExportMbr | null
  manufacturingDate?: Date | string | null
  expiryDate?: Date | string | null
  status?: string | null
  initiatedBy?: ExportPerson | null
  startedAt?: Date | string | null
  completedAt?: Date | string | null
  materials?: ExportBatchMaterial[]
  steps?: ExportStep[]
  deviations?: ExportDeviation[]
  actualYieldValue?: number | null
  actualYieldUnit?: string | null
  yieldPercentage?: number | null
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { batchId } = await params
    const batch = await getBatchById(batchId, session.user.orgId)
    if (!batch) return new NextResponse("Not found", { status: 404 })

    const html = generateBatchRecordHTML(batch as unknown as ExportBatch, session.user as ExportUser)

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("[GET /api/batches/[batchId]/export]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────

function fmt(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function fmtDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function passFailBadge(value: boolean | null | undefined, passLabel = "PASS", failLabel = "FAIL"): string {
  if (value === null || value === undefined) return '<span style="color:#666">N/A</span>'
  return value
    ? `<span class="pass">${passLabel}</span>`
    : `<span class="fail">${failLabel}</span>`
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    dispensed: "Dispensed",
    verified: "Verified",
    skipped: "Skipped",
  }
  return map[status] ?? status
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""
}

// ─────────────────────────────────────────────
// Section generators
// ─────────────────────────────────────────────

function generateBatchInfoSection(batch: ExportBatch): string {
  const mbr = batch.mbr
  const product = mbr?.product
  return `
  <div class="section-title">1. BATCH INFORMATION</div>
  <table>
    <tr>
      <th style="width:25%">Batch Number</th>
      <td style="width:25%"><strong>${batch.batchNumber}</strong></td>
      <th style="width:25%">Document No. (MBR Code)</th>
      <td style="width:25%">${mbr?.mbrCode ?? "—"} v${mbr?.version ?? ""}</td>
    </tr>
    <tr>
      <th>Product Name</th>
      <td>${product?.productName ?? "—"}</td>
      <th>Dosage Form</th>
      <td>${product?.dosageForm ?? "—"}</td>
    </tr>
    <tr>
      <th>Strength</th>
      <td>${product?.strength ?? "—"}</td>
      <th>Batch Size</th>
      <td>${mbr?.batchSizeValue ? `${Number(mbr.batchSizeValue).toLocaleString()} ${mbr.batchSizeUnit ?? ""}` : "—"}</td>
    </tr>
    <tr>
      <th>Manufacturing Date</th>
      <td>${fmtDate(batch.manufacturingDate)}</td>
      <th>Expiry Date</th>
      <td>${fmtDate(batch.expiryDate)}</td>
    </tr>
    <tr>
      <th>Batch Status</th>
      <td><strong>${capitalize(batch.status?.replace(/_/g, " ") ?? "")}</strong></td>
      <th>Initiated By</th>
      <td>${batch.initiatedBy?.fullName ?? "—"}${batch.initiatedBy?.employeeId ? ` (${batch.initiatedBy.employeeId})` : ""}</td>
    </tr>
    <tr>
      <th>Started At</th>
      <td>${fmt(batch.startedAt)}</td>
      <th>Completed At</th>
      <td>${fmt(batch.completedAt)}</td>
    </tr>
  </table>`
}

function generateMaterialsSection(batch: ExportBatch): string {
  const materials = batch.materials ?? []
  if (materials.length === 0) {
    return `
    <div class="section-title">2. BILL OF MATERIALS / DISPENSING RECORD</div>
    <p style="padding:8px;color:#666">No materials recorded for this batch.</p>`
  }

  const rows = materials.map((m: ExportBatchMaterial) => {
    const mbrMat = m.mbrMaterial
    const tolerancePlus = mbrMat?.tolerancePlus != null ? `+${mbrMat.tolerancePlus}%` : "—"
    const toleranceMinus = mbrMat?.toleranceMinus != null ? `-${mbrMat.toleranceMinus}%` : "—"
    const tolerance = mbrMat ? `${toleranceMinus} / ${tolerancePlus}` : "—"
    return `
    <tr>
      <td>${m.material?.materialName ?? m.material?.name ?? "—"}</td>
      <td>${capitalize(m.material?.materialType ?? "")}</td>
      <td>${m.requiredQuantity != null ? `${Number(m.requiredQuantity).toLocaleString()} ${m.material?.unit ?? ""}` : "—"}</td>
      <td>${m.actualQuantity != null ? `${Number(m.actualQuantity).toLocaleString()} ${m.material?.unit ?? ""}` : "—"}</td>
      <td>${tolerance}</td>
      <td>${passFailBadge(m.isWithinTolerance)}</td>
      <td>${m.arNumber ?? "—"}</td>
      <td>${m.supplierBatchNumber ?? "—"}</td>
      <td>${m.dispensedBy?.fullName ?? "—"}${m.dispensedBy?.employeeId ? ` (${m.dispensedBy.employeeId})` : ""}<br><small>${fmt(m.dispensedAt)}</small></td>
      <td>${m.verifiedBy?.fullName ?? "—"}${m.verifiedBy?.employeeId ? ` (${m.verifiedBy.employeeId})` : ""}<br><small>${fmt(m.verifiedAt)}</small></td>
    </tr>`
  }).join("")

  return `
  <div class="section-title">2. BILL OF MATERIALS / DISPENSING RECORD</div>
  <table>
    <thead>
      <tr>
        <th>Material Name</th>
        <th>Type</th>
        <th>Required Qty</th>
        <th>Actual Qty</th>
        <th>Tolerance (−/+)</th>
        <th>Within Tol.</th>
        <th>AR Number</th>
        <th>Supplier Batch</th>
        <th>Dispensed By</th>
        <th>Verified By</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>`
}

function generateStepsSection(batch: ExportBatch): string {
  const steps = batch.steps ?? []
  if (steps.length === 0) {
    return `
    <div class="section-title">3. MANUFACTURING STEPS</div>
    <p style="padding:8px;color:#666">No manufacturing steps recorded for this batch.</p>`
  }

  const stepBlocks = steps.map((step: ExportStep) => {
    const mbrStep = step.mbrStep

    // ── Step header ──
    const header = `
    <div class="step-header">
      Step ${step.stepNumber}: ${mbrStep?.stepName ?? step.stepName ?? "Unnamed Step"}
      &nbsp;|&nbsp; Stage: ${mbrStep?.stage ?? "—"}
      &nbsp;|&nbsp; Status: ${statusLabel(step.status)}
    </div>
    <table>
      <tr>
        <th style="width:16%">Performed By</th>
        <td style="width:34%">${step.performedBy?.fullName ?? "—"}${step.performedBy?.employeeId ? ` (${step.performedBy.employeeId})` : ""}</td>
        <th style="width:16%">Verified By</th>
        <td style="width:34%">${step.verifiedBy?.fullName ?? "—"}${step.verifiedBy?.employeeId ? ` (${step.verifiedBy.employeeId})` : ""}</td>
      </tr>
      <tr>
        <th>Started At</th>
        <td>${fmt(step.startedAt)}</td>
        <th>Completed At</th>
        <td>${fmt(step.completedAt)}</td>
      </tr>
      <tr>
        <th>Equipment</th>
        <td>${step.equipment ? `${step.equipment.equipmentName} (${step.equipment.equipmentCode})` : "—"}</td>
        <th>Env. Conditions</th>
        <td>${step.envTemperature != null ? `${step.envTemperature}°C` : "—"} / ${step.envHumidity != null ? `${step.envHumidity}% RH` : "—"}</td>
      </tr>
      ${step.remarks ? `<tr><th>Remarks</th><td colspan="3">${step.remarks}</td></tr>` : ""}
      <tr>
        <th>Area Clean Verified</th>
        <td>${passFailBadge(step.areaCleanVerified, "Yes", "No")}</td>
        <th>Equipment Clean Verified</th>
        <td>${passFailBadge(step.equipmentCleanVerified, "Yes", "No")}</td>
      </tr>
    </table>`

    // ── Instructions ──
    const instructions = mbrStep?.instructions
      ? `<p style="margin:4px 0 10px;padding:6px 10px;background:#fafafa;border-left:3px solid #ccc;font-size:10px;color:#444"><strong>Instructions:</strong> ${mbrStep.instructions}</p>`
      : ""

    // ── Parameters ──
    let paramsBlock = ""
    if (step.parameters && step.parameters.length > 0) {
      const paramRows = step.parameters.map((p: ExportParameter) => {
        const mbrParam = p.mbrParameter
        const limitRange = mbrParam?.minValue != null && mbrParam?.maxValue != null
          ? `${mbrParam.minValue} – ${mbrParam.maxValue} ${mbrParam.unit ?? ""}`
          : (mbrParam?.unit ?? "—")
        return `
        <tr>
          <td>${p.parameterName}</td>
          <td>${p.actualValue ?? "—"}${mbrParam?.unit ? ` ${mbrParam.unit}` : ""}</td>
          <td>${limitRange}</td>
          <td>${passFailBadge(p.isWithinLimit)}</td>
          <td>${fmt(p.recordedAt)}</td>
        </tr>`
      }).join("")
      paramsBlock = `
      <p style="margin:8px 0 4px;font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#555">Process Parameters</p>
      <table>
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Actual Value</th>
            <th>Acceptance Limit</th>
            <th>Within Limit</th>
            <th>Recorded At</th>
          </tr>
        </thead>
        <tbody>${paramRows}</tbody>
      </table>`
    }

    // ── IPC Results ──
    let ipcBlock = ""
    if (step.ipcResults && step.ipcResults.length > 0) {
      const ipcRows = step.ipcResults.map((r: ExportIpcResult) => {
        const mbrIpc = r.mbrIpc
        const spec = mbrIpc?.minValue != null && mbrIpc?.maxValue != null
          ? `${mbrIpc.minValue} – ${mbrIpc.maxValue} ${mbrIpc.unit ?? ""}`
          : (mbrIpc?.acceptanceCriteria ?? "—")
        return `
        <tr>
          <td>${r.checkName}</td>
          <td>${fmt(r.checkTime)}</td>
          <td>${r.resultValue ?? "—"}</td>
          <td>${spec}</td>
          <td>${passFailBadge(r.isWithinSpec)}</td>
          <td>${r.remarks ?? "—"}</td>
        </tr>`
      }).join("")
      ipcBlock = `
      <p style="margin:8px 0 4px;font-weight:bold;font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:#555">In-Process Controls (IPC)</p>
      <table>
        <thead>
          <tr>
            <th>Check Name</th>
            <th>Check Time</th>
            <th>Result</th>
            <th>Acceptance Spec</th>
            <th>Within Spec</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>${ipcRows}</tbody>
      </table>`
    }

    // ── Step deviations (linked) ──
    let stepDeviationsBlock = ""
    if (step.deviations && step.deviations.length > 0) {
      const devLinks = step.deviations.map((d: ExportStepDeviation) =>
        `<span class="fail">${d.deviationNumber ?? ""} [${capitalize(d.severity ?? "")}] — ${capitalize(d.status ?? "")}</span>`
      ).join(", ")
      stepDeviationsBlock = `<p style="margin:4px 0 10px;font-size:10px"><strong>Linked Deviations:</strong> ${devLinks}</p>`
    }

    return `<div style="margin-bottom:20px;page-break-inside:avoid">
      ${header}
      ${instructions}
      ${paramsBlock}
      ${ipcBlock}
      ${stepDeviationsBlock}
    </div>`
  }).join("")

  return `
  <div class="section-title">3. MANUFACTURING STEPS</div>
  ${stepBlocks}`
}

function generateDeviationsSection(batch: ExportBatch): string {
  const deviations = batch.deviations ?? []
  if (deviations.length === 0) {
    return `
    <div class="section-title">4. DEVIATIONS</div>
    <p style="padding:8px;color:#666">No deviations recorded for this batch.</p>`
  }

  const rows = deviations.map((d: ExportDeviation) => `
    <tr>
      <td>${d.deviationNumber ?? "—"}</td>
      <td>${fmtDate(d.raisedAt)}</td>
      <td><span class="fail">${capitalize(d.severity ?? "")}</span></td>
      <td>${capitalize(d.status?.replace(/_/g, " ") ?? "")}</td>
      <td>${d.description ?? "—"}</td>
      <td>${d.rootCause ?? "—"}</td>
      <td>${d.correctiveAction ?? "—"}</td>
      <td>${d.raisedBy?.fullName ?? "—"}</td>
    </tr>`).join("")

  return `
  <div class="section-title">4. DEVIATIONS</div>
  <table>
    <thead>
      <tr>
        <th>Deviation No.</th>
        <th>Date Raised</th>
        <th>Severity</th>
        <th>Status</th>
        <th>Description</th>
        <th>Root Cause</th>
        <th>Corrective Action</th>
        <th>Raised By</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`
}

function generateYieldSection(batch: ExportBatch): string {
  const actual = batch.actualYieldValue
  const unit = batch.actualYieldUnit ?? ""
  const theoretical = batch.mbr?.theoreticalYield
  const pct = batch.yieldPercentage

  const yieldStatus = pct != null
    ? (Number(pct) >= 98 ? "PASS" : Number(pct) >= 95 ? "REVIEW" : "FAIL")
    : "—"
  const yieldColor = pct != null
    ? (Number(pct) >= 98 ? "green" : Number(pct) >= 95 ? "orange" : "red")
    : "#666"

  return `
  <div class="section-title">5. YIELD RECONCILIATION</div>
  <table>
    <tr>
      <th style="width:25%">Theoretical Yield</th>
      <td style="width:25%">${theoretical != null ? `${Number(theoretical).toLocaleString()} ${unit}` : "—"}</td>
      <th style="width:25%">Actual Yield</th>
      <td style="width:25%">${actual != null ? `${Number(actual).toLocaleString()} ${unit}` : "—"}</td>
    </tr>
    <tr>
      <th>Yield Percentage</th>
      <td><strong style="color:${yieldColor}">${pct != null ? `${Number(pct).toFixed(2)}%` : "—"}</strong></td>
      <th>Yield Status</th>
      <td><strong style="color:${yieldColor}">${yieldStatus}</strong></td>
    </tr>
  </table>`
}

function generateSignaturesSection(): string {
  return `
  <div class="section-title">6. AUTHORISATION &amp; REVIEW SIGNATURES</div>
  <p style="font-size:10px;color:#444;margin-bottom:12px">
    All signatories confirm that this Batch Manufacturing Record has been reviewed and is accurate, complete, and compliant with the approved Master Batch Record and current GMP requirements.
  </p>
  <div style="display:flex;gap:20px;flex-wrap:wrap">
    <div class="signature-box">
      <div style="height:50px"></div>
      <div style="border-top:1px solid #000;padding-top:6px">
        <strong>Production Operator</strong><br>
        Name: _______________________<br>
        Employee ID: ______________<br>
        Date: ______________________
      </div>
    </div>
    <div class="signature-box">
      <div style="height:50px"></div>
      <div style="border-top:1px solid #000;padding-top:6px">
        <strong>Production Supervisor</strong><br>
        Name: _______________________<br>
        Employee ID: ______________<br>
        Date: ______________________
      </div>
    </div>
    <div class="signature-box">
      <div style="height:50px"></div>
      <div style="border-top:1px solid #000;padding-top:6px">
        <strong>QA Reviewer</strong><br>
        Name: _______________________<br>
        Employee ID: ______________<br>
        Date: ______________________
      </div>
    </div>
    <div class="signature-box">
      <div style="height:50px"></div>
      <div style="border-top:1px solid #000;padding-top:6px">
        <strong>QA Manager / Head of Quality</strong><br>
        Name: _______________________<br>
        Employee ID: ______________<br>
        Date: ______________________
      </div>
    </div>
  </div>`
}

// ─────────────────────────────────────────────
// Main HTML generator
// ─────────────────────────────────────────────

function generateBatchRecordHTML(batch: ExportBatch, user: ExportUser): string {
  const printedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Batch Record — ${batch.batchNumber}</title>
  <style>
    /* ── Reset & Base ── */
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #000;
      margin: 0;
      padding: 20px 28px;
      background: #fff;
    }

    /* ── Header ── */
    .page-header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 18px;
    }
    .page-header h1 {
      margin: 0 0 4px;
      font-size: 16px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .page-header h2 {
      margin: 0 0 6px;
      font-size: 13px;
      font-weight: normal;
    }
    .page-header .meta {
      font-size: 10px;
      color: #444;
    }

    /* ── Section title ── */
    .section-title {
      background: #2c2c2c;
      color: #fff;
      padding: 5px 10px;
      margin: 22px 0 10px;
      font-weight: bold;
      font-size: 11px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* ── Tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 10.5px;
    }
    th, td {
      border: 1px solid #999;
      padding: 4px 7px;
      text-align: left;
      vertical-align: top;
    }
    thead th {
      background: #ececec;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.3px;
    }
    /* info table alternating header rows */
    tr th {
      background: #f5f5f5;
      font-weight: bold;
      width: 20%;
    }

    /* ── Step blocks ── */
    .step-header {
      background: #e4e4e4;
      padding: 5px 10px;
      margin: 14px 0 6px;
      font-weight: bold;
      font-size: 11px;
      border-left: 4px solid #2c2c2c;
    }

    /* ── Status colours ── */
    .pass { color: #1a7a1a; font-weight: bold; }
    .fail { color: #c0392b; font-weight: bold; }

    /* ── Signature boxes ── */
    .signature-box {
      border: 1px solid #000;
      padding: 12px 16px 10px;
      margin: 8px 4px;
      display: inline-block;
      width: 210px;
      text-align: left;
      vertical-align: top;
      font-size: 10px;
      line-height: 1.7;
    }

    /* ── Footer ── */
    .doc-footer {
      margin-top: 30px;
      border-top: 1px solid #ccc;
      padding-top: 6px;
      font-size: 9px;
      color: #666;
      display: flex;
      justify-content: space-between;
    }

    /* ── Screen-only print toolbar ── */
    .no-print {
      background: #f0f4f8;
      border: 1px solid #c8d6e5;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .no-print button {
      padding: 7px 16px;
      font-size: 13px;
      font-family: Arial, sans-serif;
      cursor: pointer;
      border-radius: 4px;
      border: 1px solid #4a90d9;
      background: #4a90d9;
      color: #fff;
      font-weight: bold;
    }
    .no-print button.secondary {
      background: #fff;
      color: #444;
      border-color: #aaa;
      font-weight: normal;
    }
    .no-print span {
      font-size: 11px;
      color: #555;
    }

    /* ── Print overrides ── */
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .step-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }

    @page {
      margin: 1.2cm;
      size: A4 portrait;
    }
  </style>
</head>
<body>

  <!-- ── Print toolbar (hidden on print) ── -->
  <div class="no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
    <button class="secondary" onclick="window.close()">Close</button>
    <span>To save as PDF: click <strong>Print</strong>, then choose <em>Save as PDF</em> as the destination in your browser's print dialog.</span>
  </div>

  <!-- ── Document header ── -->
  <div class="page-header">
    <h1>Batch Manufacturing Record</h1>
    <h2>${batch.mbr?.product?.productName ?? ""}${batch.mbr?.product?.strength ? " &mdash; " + batch.mbr.product.strength : ""}${batch.mbr?.product?.dosageForm ? " (" + batch.mbr.product.dosageForm + ")" : ""}</h2>
    <div class="meta">
      Batch Number: <strong>${batch.batchNumber}</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      MBR Code: <strong>${batch.mbr?.mbrCode ?? "—"} v${batch.mbr?.version ?? ""}</strong>
      &nbsp;&nbsp;|&nbsp;&nbsp;
      Status: <strong>${capitalize(batch.status?.replace(/_/g, " ") ?? "")}</strong>
    </div>
  </div>

  <!-- ── Sections ── -->
  ${generateBatchInfoSection(batch)}
  ${generateMaterialsSection(batch)}
  ${generateStepsSection(batch)}
  ${generateDeviationsSection(batch)}
  ${generateYieldSection(batch)}
  ${generateSignaturesSection()}

  <!-- ── Document footer ── -->
  <div class="doc-footer">
    <span>This document is a computer-generated Batch Manufacturing Record. Treat as a controlled document.</span>
    <span>Printed by: ${user?.fullName ?? user?.email ?? "—"} &nbsp;|&nbsp; Printed at: ${printedAt}</span>
  </div>

</body>
</html>`
}
