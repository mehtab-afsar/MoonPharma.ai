import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getMaterials } from "@/server/services/material.server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FlaskConical, Eye } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  active: "Active Ingredient",
  excipient: "Excipient",
  packaging: "Packaging",
  consumable: "Consumable",
}

const TYPE_STYLES: Record<string, string> = {
  active:     "bg-gray-900 text-white border-gray-900",
  excipient:  "bg-gray-100 text-gray-800 border-gray-200",
  packaging:  "bg-gray-50  text-gray-600 border-gray-200",
  consumable: "bg-white    text-gray-500 border-gray-300",
}

export default async function MaterialsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const materials = await getMaterials(session.user.orgId)

  const counts = {
    total: materials.length,
    active: materials.filter((m) => m.materialType === "active").length,
    excipient: materials.filter((m) => m.materialType === "excipient").length,
    packaging: materials.filter((m) => m.materialType === "packaging").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Materials</h1>
          <p className="mt-1 text-sm text-gray-500">
            Raw materials, excipients, and packaging components catalogue.
          </p>
        </div>
        <Button asChild className="gap-2 bg-black text-white hover:bg-gray-800">
          <Link href="/materials/new">
            <Plus className="h-4 w-4" />
            New Material
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Materials", value: counts.total },
          { label: "Active Ingredients", value: counts.active },
          { label: "Excipients", value: counts.excipient },
          { label: "Packaging", value: counts.packaging },
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
          <CardTitle className="text-base font-semibold text-gray-900">All Materials</CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {materials.length} material{materials.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {materials.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <FlaskConical className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No materials yet</p>
              <p className="text-xs text-gray-400">Add your first material to get started.</p>
              <Button asChild size="sm" className="mt-3 gap-2 bg-black text-white hover:bg-gray-800">
                <Link href="/materials/new">
                  <Plus className="h-3.5 w-3.5" />
                  New Material
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">Material Code</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Material Name</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Unit of Measure</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Grade</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => (
                  <TableRow key={m.id} className="border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                      {m.materialCode}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{m.materialName}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
                          TYPE_STYLES[m.materialType] ?? "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                      >
                        {TYPE_LABELS[m.materialType] ?? m.materialType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{m.unitOfMeasure}</TableCell>
                    <TableCell>
                      {m.pharmacoepialGrade ? (
                        <Badge variant="outline" className="text-xs font-mono">
                          {m.pharmacoepialGrade.replace("_", "-")}
                        </Badge>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={`/materials/${m.id}`}>
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
