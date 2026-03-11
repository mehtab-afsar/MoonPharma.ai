"use client"

import { Badge } from "@/components/ui/badge"
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "@/shared/constants/pharma.constants"

const STEP_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  skipped: "Skipped",
}

const STEP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  skipped: "bg-gray-100 text-gray-400 border-gray-200",
}

const MATERIAL_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  dispensed: "Dispensed",
  verified: "Verified",
  rejected: "Rejected",
}

const MATERIAL_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 border-gray-200",
  dispensed: "bg-blue-100 text-blue-700 border-blue-200",
  verified: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
}

interface BatchStatusBadgeProps {
  status: string
  type?: "batch" | "step" | "material"
}

export function BatchStatusBadge({ status, type = "batch" }: BatchStatusBadgeProps) {
  let label: string
  let colorClass: string

  if (type === "step") {
    label = STEP_STATUS_LABELS[status] ?? status
    colorClass = STEP_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
  } else if (type === "material") {
    label = MATERIAL_STATUS_LABELS[status] ?? status
    colorClass = MATERIAL_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600 border-gray-200"
  } else {
    label = BATCH_STATUS_LABELS[status as keyof typeof BATCH_STATUS_LABELS] ?? status
    const baseColor = BATCH_STATUS_COLORS[status as keyof typeof BATCH_STATUS_COLORS] ?? "bg-gray-100 text-gray-700"
    // Convert tailwind bg/text classes to add border
    colorClass = `${baseColor} border-transparent`
  }

  return (
    <Badge variant="outline" className={`text-xs border ${colorClass}`}>
      {label}
    </Badge>
  )
}
