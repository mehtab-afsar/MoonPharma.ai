export const DOSAGE_FORMS = [
  "Tablet", "Capsule", "Syrup", "Injection", "Cream",
  "Ointment", "Suspension", "Solution", "Powder", "Granules",
] as const

export const MATERIAL_TYPES = [
  { value: "active", label: "Active Pharmaceutical Ingredient" },
  { value: "excipient", label: "Excipient" },
  { value: "packaging", label: "Packaging Material" },
  { value: "consumable", label: "Consumable" },
] as const

export const PHARMACOEPIAL_GRADES = [
  { value: "IP", label: "IP (Indian Pharmacopoeia)" },
  { value: "BP", label: "BP (British Pharmacopoeia)" },
  { value: "USP", label: "USP (United States Pharmacopoeia)" },
  { value: "In_house", label: "In-House" },
] as const

export const EQUIPMENT_TYPES = [
  "Rapid Mixer Granulator (RMG)",
  "Fluid Bed Dryer (FBD)",
  "Vibro Sifter",
  "Tablet Press",
  "Coating Pan",
  "Blender",
  "Milling Machine",
  "Capsule Filling Machine",
  "Packaging Machine",
  "Other",
] as const

export const EQUIPMENT_STATUS_LABELS = {
  available: "Available",
  in_use: "In Use",
  maintenance: "Under Maintenance",
  retired: "Retired",
} as const

export const MBR_STATUS_LABELS = {
  draft: "Draft",
  pending_review: "Pending Review",
  approved: "Approved",
  effective: "Effective",
  superseded: "Superseded",
  obsolete: "Obsolete",
} as const

export const BATCH_STATUS_LABELS = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  on_hold: "On Hold",
} as const

export const BATCH_STATUS_COLORS = {
  planned: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-yellow-100 text-yellow-700",
  under_review: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  on_hold: "bg-purple-100 text-purple-700",
} as const

export const DEVIATION_SEVERITY_LABELS = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
} as const

export const DEVIATION_SEVERITY_COLORS = {
  minor: "bg-yellow-100 text-yellow-700",
  major: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
} as const

export const PARAMETER_TYPES = [
  { value: "numeric", label: "Numeric (with limits)" },
  { value: "text", label: "Text (free entry)" },
  { value: "boolean", label: "Yes/No (checkbox)" },
  { value: "selection", label: "Selection (dropdown)" },
] as const

export const MANUFACTURING_STAGES = [
  "Dispensing",
  "Sifting",
  "Granulation",
  "Drying",
  "Milling",
  "Lubrication",
  "Compression",
  "Coating",
  "Packing",
  "Other",
] as const

// Batch number format: B{YYYY}-{sequence}
export function generateBatchNumber(year: number, sequence: number): string {
  return `B${year}-${String(sequence).padStart(3, "0")}`
}

// Deviation number format: DEV-{YYYY}-{sequence}
export function generateDeviationNumber(year: number, sequence: number): string {
  return `DEV-${year}-${String(sequence).padStart(4, "0")}`
}
