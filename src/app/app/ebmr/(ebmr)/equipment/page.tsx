import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getEquipment } from "@/server/services/equipment.server"
import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Cpu, Eye, AlertCircle, ShieldAlert } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import { getEquipmentRiskScores } from "@/server/services/equipment-risk.server"

const STATUS_STYLES: Record<string, string> = {
  available:   "bg-gray-50 text-gray-700 border-gray-200",
  in_use:      "bg-gray-900 text-white border-gray-900",
  maintenance: "bg-gray-200 text-gray-600 border-gray-300",
  retired:     "bg-white text-gray-400 border-gray-200",
}

const STATUS_LABELS: Record<string, string> = {
  available:   "Available",
  in_use:      "In Use",
  maintenance: "Maintenance",
  retired:     "Retired",
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" })
}

function isCalibrationDue(nextDate: Date | null | undefined): boolean {
  if (!nextDate) return false
  return new Date(nextDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // within 30 days
}

export default async function EquipmentPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [equipment, riskScores] = await Promise.all([
    getEquipment(session.user.orgId),
    getEquipmentRiskScores(session.user.orgId),
  ])

  const counts = {
    total: equipment.length,
    available: equipment.filter((e) => e.status === "available").length,
    inUse: equipment.filter((e) => e.status === "in_use").length,
    maintenance: equipment.filter((e) => e.status === "maintenance").length,
  }

  const dueSoon = equipment.filter((e) => isCalibrationDue(e.nextCalibrationDate)).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Equipment</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manufacturing equipment register with calibration tracking.
          </p>
        </div>
        <Button asChild className="gap-2 bg-black text-white hover:bg-gray-800">
          <Link href={ROUTES.EQUIPMENT_NEW}>
            <Plus className="h-4 w-4" />
            New Equipment
          </Link>
        </Button>
      </div>

      {/* Calibration alert */}
      {dueSoon > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-gray-600 flex-shrink-0" />
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{dueSoon} equipment item{dueSoon > 1 ? "s" : ""}</span>{" "}
            have calibration due within 30 days.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Equipment", value: counts.total },
          { label: "Available", value: counts.available },
          { label: "In Use", value: counts.inUse },
          { label: "Maintenance", value: counts.maintenance },
        ].map((s) => (
          <Card key={s.label} className="border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Equipment Register</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {equipment.length} equipment item{equipment.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {equipment.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <Cpu className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No equipment registered</p>
              <p className="text-xs text-gray-400">Add your manufacturing equipment to track calibration.</p>
              <Button asChild size="sm" className="mt-3 gap-2 bg-black text-white hover:bg-gray-800">
                <Link href={ROUTES.EQUIPMENT_NEW}>
                  <Plus className="h-3.5 w-3.5" />
                  New Equipment
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">Equipment Code</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Location</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Last Calibration</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Next Calibration</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Risk
                    </span>
                  </TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipment.map((eq) => {
                  const due = isCalibrationDue(eq.nextCalibrationDate)
                  const risk = riskScores.get(eq.id)
                  return (
                    <TableRow key={eq.id} className="border-gray-100 hover:bg-gray-50/50">
                      <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                        {eq.equipmentCode}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">{eq.equipmentName}</TableCell>
                      <TableCell className="text-sm text-gray-600">{eq.equipmentType}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {eq.location ?? <span className="text-gray-300">—</span>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDate(eq.lastCalibrationDate)}
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm ${due ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                          {formatDate(eq.nextCalibrationDate)}
                          {due && <span className="ml-1 text-xs text-gray-500">(due)</span>}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
                            STATUS_STYLES[eq.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {STATUS_LABELS[eq.status] ?? eq.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {risk ? (
                          <span
                            title={risk.riskFactors.join("; ")}
                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium cursor-help ${
                              risk.riskScore === "high"
                                ? "bg-gray-800 text-white border-gray-800"
                                : risk.riskScore === "medium"
                                ? "bg-gray-200 text-gray-700 border-gray-300"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            }`}
                          >
                            <ShieldAlert className="h-3 w-3" />
                            {risk.riskScore.charAt(0).toUpperCase() + risk.riskScore.slice(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button asChild size="sm" variant="ghost" className="gap-1.5">
                          <Link href={ROUTES.EQUIPMENT_DETAIL(eq.id)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
