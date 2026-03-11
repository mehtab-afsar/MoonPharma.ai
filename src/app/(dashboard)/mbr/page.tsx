import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
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
import { Plus, BookOpen, Eye } from "lucide-react"
import { MBR_STATUS_LABELS } from "@/shared/constants/pharma.constants"

interface MBRListItem {
  id: string
  mbrCode: string
  version: number
  status: string
  batchSizeValue: number
  batchSizeUnit: string
  product?: { productName?: string; strength?: string }
  _count?: { steps?: number }
}

const MBR_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  effective: "bg-green-100 text-green-700 border-green-200",
  superseded: "bg-gray-100 text-gray-500 border-gray-200",
  obsolete: "bg-gray-100 text-gray-400 border-gray-200",
}

async function getMBRs(orgId: string, baseUrl: string) {
  const headersList = await headers()
  const cookie = headersList.get("cookie") ?? ""

  const res = await fetch(`${baseUrl}/api/mbr`, {
    headers: { cookie },
    cache: "no-store",
  })

  if (!res.ok) return []

  const json = await res.json()
  return json.data ?? []
}

export default async function MBRListPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const headersList = await headers()
  const host = headersList.get("host") ?? "localhost:3000"
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  const baseUrl = `${protocol}://${host}`

  const mbrs = await getMBRs(session.user.orgId, baseUrl)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Master Batch Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage master batch records (MBRs) — the authorised recipes for manufacturing.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/mbr/new">
            <Plus className="h-4 w-4" />
            New MBR
          </Link>
        </Button>
      </div>

      {/* MBR Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            All Master Batch Records
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {mbrs.length} MBR{mbrs.length !== 1 ? "s" : ""} registered
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {mbrs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <BookOpen className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No master batch records yet</p>
              <p className="text-xs text-gray-400">
                Create your first MBR to define manufacturing procedures.
              </p>
              <Button asChild size="sm" className="mt-3 gap-2">
                <Link href="/mbr/new">
                  <Plus className="h-3.5 w-3.5" />
                  New MBR
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">
                    MBR Code
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Version
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Batch Size
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">
                    Steps
                  </TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mbrs.map((mbr: MBRListItem) => (
                  <TableRow
                    key={mbr.id}
                    className="border-gray-100 hover:bg-gray-50/50"
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                      {mbr.mbrCode}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      v{mbr.version}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <span className="font-medium">{mbr.product?.productName}</span>
                      {mbr.product?.strength && (
                        <span className="ml-1 text-gray-400 text-xs">
                          {mbr.product.strength}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {Number(mbr.batchSizeValue).toLocaleString()} {mbr.batchSizeUnit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${MBR_STATUS_COLORS[mbr.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {MBR_STATUS_LABELS[mbr.status as keyof typeof MBR_STATUS_LABELS] ?? mbr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {mbr._count?.steps ?? 0} steps
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={`/mbr/${mbr.id}`}>
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
