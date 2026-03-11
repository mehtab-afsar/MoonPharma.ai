import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getMBRById } from "@/server/services/mbr.server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronLeft, FlaskConical } from "lucide-react"
import { MBR_STATUS_LABELS } from "@/shared/constants/pharma.constants"
import { MBRApproveButton } from "@/features/mbr/components/MBRApproveButton"
import { MBRSubmitButton } from "@/features/mbr/components/MBRSubmitButton"
import { MBRStepsAccordion } from "@/features/mbr/components/MBRStepsAccordion"

const MBR_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-200",
  pending_review: "bg-yellow-100 text-yellow-700 border-yellow-200",
  approved: "bg-blue-100 text-blue-700 border-blue-200",
  effective: "bg-green-100 text-green-700 border-green-200",
  superseded: "bg-gray-100 text-gray-500 border-gray-200",
  obsolete: "bg-gray-100 text-gray-400 border-gray-200",
}

interface RouteContext {
  params: Promise<{ mbrId: string }>
}

export default async function MBRDetailPage({ params }: RouteContext) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { mbrId } = await params
  const mbr = await getMBRById(mbrId, session.user.orgId)

  if (!mbr) notFound()

  const canSubmit = mbr.status === "draft"
  const canApprove =
    mbr.status === "pending_review" &&
    (session.user.role === "qa_head" || session.user.role === "production_head")

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900">
          <Link href="/mbr">
            <ChevronLeft className="h-4 w-4" />
            Back to MBRs
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-gray-900 font-mono">
              {mbr.mbrCode}
            </h1>
            <Badge variant="outline" className="text-sm border-gray-200 text-gray-500">
              v{mbr.version}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs border ${MBR_STATUS_COLORS[mbr.status] ?? "bg-gray-100 text-gray-600"}`}
            >
              {MBR_STATUS_LABELS[mbr.status as keyof typeof MBR_STATUS_LABELS] ?? mbr.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {mbr.product.productName}
            {mbr.product.strength && (
              <span className="ml-2 text-gray-400">{mbr.product.strength} · {mbr.product.dosageForm}</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canSubmit && (
            <MBRSubmitButton mbrId={mbr.id} />
          )}
          {canApprove && (
            <MBRApproveButton mbrId={mbr.id} />
          )}
        </div>
      </div>

      {/* Basic Info Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-gray-400" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Product</p>
              <p className="font-medium text-gray-900">{mbr.product.productName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dosage Form</p>
              <p className="font-medium text-gray-900">{mbr.product.dosageForm}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Strength</p>
              <p className="font-medium text-gray-900">{mbr.product.strength}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Batch Size</p>
              <p className="font-medium text-gray-900">
                {Number(mbr.batchSizeValue).toLocaleString()} {mbr.batchSizeUnit}
              </p>
            </div>
            {mbr.theoreticalYieldValue && (
              <div>
                <p className="text-xs text-gray-500">Theoretical Yield</p>
                <p className="font-medium text-gray-900">
                  {Number(mbr.theoreticalYieldValue).toLocaleString()} {mbr.theoreticalYieldUnit}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Yield Limits</p>
              <p className="font-medium text-gray-900">
                {Number(mbr.yieldLimitMin)}% – {Number(mbr.yieldLimitMax)}%
              </p>
            </div>
            {mbr.effectiveDate && (
              <div>
                <p className="text-xs text-gray-500">Effective Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(mbr.effectiveDate).toLocaleDateString()}
                </p>
              </div>
            )}
            {mbr.reviewDate && (
              <div>
                <p className="text-xs text-gray-500">Review Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(mbr.reviewDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="font-medium text-gray-900">{mbr.createdBy.fullName}</p>
            </div>
            {mbr.approvedBy && (
              <div>
                <p className="text-xs text-gray-500">Approved By</p>
                <p className="font-medium text-gray-900">{mbr.approvedBy.fullName}</p>
              </div>
            )}
            {mbr.approvedAt && (
              <div>
                <p className="text-xs text-gray-500">Approved At</p>
                <p className="font-medium text-gray-900">
                  {new Date(mbr.approvedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill of Materials */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Bill of Materials
            <Badge variant="secondary" className="ml-2 text-xs">
              {mbr.materials.length} items
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {mbr.materials.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No materials defined.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">#</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Material</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Quantity</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Tolerance</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Stage</TableHead>
                  <TableHead className="pr-6 text-xs font-medium text-gray-500">Critical</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mbr.materials.map((m) => (
                  <TableRow key={m.id} className="border-gray-100 hover:bg-gray-50/50">
                    <TableCell className="pl-6 text-xs text-gray-500">{m.sequenceOrder}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-gray-900">{m.material.materialName}</p>
                      <p className="text-xs text-gray-400">{m.material.materialCode}</p>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 capitalize">
                      {m.material.materialType}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {Number(m.quantity).toLocaleString()} {m.unit}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {m.tolerancePlus !== null && m.toleranceMinus !== null
                        ? `+${Number(m.tolerancePlus)}% / -${Number(m.toleranceMinus)}%`
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {m.stage ?? <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className="pr-6">
                      {m.isCritical ? (
                        <Badge variant="outline" className="text-xs border-orange-200 text-orange-600 bg-orange-50">
                          Critical
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manufacturing Steps */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">
            Manufacturing Steps
            <Badge variant="secondary" className="ml-2 text-xs">
              {mbr.steps.length} steps
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <MBRStepsAccordion steps={mbr.steps} />
        </CardContent>
      </Card>
    </div>
  )
}
