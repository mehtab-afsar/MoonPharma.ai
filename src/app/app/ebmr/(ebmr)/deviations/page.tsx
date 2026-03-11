"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Eye, Loader2 } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import {
  DEVIATION_SEVERITY_COLORS,
  DEVIATION_SEVERITY_LABELS,
} from "@/shared/constants/pharma.constants"

// ============================================
// TYPES
// ============================================

type DeviationStatusFilter = "all" | "open" | "under_investigation" | "resolved" | "closed"

interface Deviation {
  id: string
  deviationNumber: string
  deviationType: string
  category: string
  severity: string
  description: string
  status: string
  raisedAt: string
  batch: {
    batchNumber: string
  }
  batchStep?: {
    stepName: string
  } | null
  raisedBy: {
    fullName: string
  }
}

// ============================================
// CONSTANTS
// ============================================

const STATUS_TABS: { value: DeviationStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "under_investigation", label: "Under Investigation" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

const DEVIATION_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  under_investigation: "bg-purple-100 text-purple-700",
  resolved: "bg-teal-100 text-teal-700",
  closed: "bg-green-100 text-green-700",
}

const DEVIATION_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_investigation: "Under Investigation",
  resolved: "Resolved",
  closed: "Closed",
}

const DEVIATION_TYPE_LABELS: Record<string, string> = {
  planned: "Planned",
  unplanned: "Unplanned",
}

const DEVIATION_CATEGORY_LABELS: Record<string, string> = {
  process: "Process",
  equipment: "Equipment",
  material: "Material",
  environmental: "Environmental",
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchDeviations(status: DeviationStatusFilter): Promise<Deviation[]> {
  const res = await fetch("/api/deviations")
  if (!res.ok) return []
  const json = await res.json()
  const all: Deviation[] = json.data ?? []
  if (status === "all") return all
  return all.filter((d) => d.status === status)
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function DeviationsPage() {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<DeviationStatusFilter>("all")

  const { data: deviations = [], isLoading } = useQuery({
    queryKey: ["deviations", activeStatus],
    queryFn: () => fetchDeviations(activeStatus),
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-gray-900">Deviations</h1>
            {!isLoading && (
              <Badge
                variant="outline"
                className="text-xs border border-gray-200 bg-gray-100 text-gray-600"
              >
                {deviations.length}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Track and investigate deviations raised during batch manufacturing.
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as DeviationStatusFilter)}>
        <TabsList className="bg-gray-100/80">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Deviations Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            {activeStatus === "all"
              ? "All Deviations"
              : `${STATUS_TABS.find((t) => t.value === activeStatus)?.label} Deviations`}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {isLoading
              ? "Loading..."
              : `${deviations.length} deviation${deviations.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : deviations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <AlertTriangle className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No deviations found</p>
              <p className="text-xs text-gray-400">
                Deviations are raised from the batch execution page.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">
                    Deviation No.
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Batch</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Severity</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Category</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500 max-w-[220px]">
                    Description
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Raised By</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Raised At</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deviations.map((deviation) => (
                  <TableRow
                    key={deviation.id}
                    className="cursor-pointer border-gray-100 hover:bg-gray-50/50"
                    onClick={() => router.push(ROUTES.DEVIATION_DETAIL(deviation.id))}
                  >
                    <TableCell className="pl-6 font-mono text-xs font-semibold text-gray-800">
                      {deviation.deviationNumber}
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-700">
                      {deviation.batch?.batchNumber ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border-transparent ${
                          DEVIATION_SEVERITY_COLORS[
                            deviation.severity as keyof typeof DEVIATION_SEVERITY_COLORS
                          ] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {DEVIATION_SEVERITY_LABELS[
                          deviation.severity as keyof typeof DEVIATION_SEVERITY_LABELS
                        ] ?? deviation.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {DEVIATION_TYPE_LABELS[deviation.deviationType] ?? deviation.deviationType}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {DEVIATION_CATEGORY_LABELS[deviation.category] ?? deviation.category}
                    </TableCell>
                    <TableCell className="max-w-[220px] text-sm text-gray-700">
                      <span className="line-clamp-2">{deviation.description}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border-transparent ${
                          DEVIATION_STATUS_COLORS[deviation.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {DEVIATION_STATUS_LABELS[deviation.status] ?? deviation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {deviation.raisedBy?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(deviation.raisedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell
                      className="pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={ROUTES.DEVIATION_DETAIL(deviation.id)}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
