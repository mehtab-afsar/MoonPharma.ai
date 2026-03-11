"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, FlaskConical, Eye, Loader2 } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import { BATCH_STATUS_LABELS, BATCH_STATUS_COLORS } from "@/shared/constants/pharma.constants"

type BatchStatus = "all" | "in_progress" | "completed" | "on_hold" | "cancelled"

interface Batch {
  id: string
  batchNumber: string
  status: string
  manufacturingDate: string | null
  expiryDate: string | null
  createdAt: string
  mbr: {
    mbrCode: string
    product: {
      productName: string
      strength?: string | null
    }
  }
  initiatedBy: {
    name: string | null
    email: string
  }
  _count?: {
    deviations: number
    batchMaterials: number
  }
}

const STATUS_TABS: { value: BatchStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
]

async function fetchBatches(status: BatchStatus): Promise<Batch[]> {
  const url = status === "all" ? "/api/batches" : `/api/batches?status=${status}`
  const res = await fetch(url)
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export default function BatchesPage() {
  const router = useRouter()
  const [activeStatus, setActiveStatus] = useState<BatchStatus>("all")

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ["batches", activeStatus],
    queryFn: () => fetchBatches(activeStatus),
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Batch Manufacturing Records</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and execute batch manufacturing against approved MBRs.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={ROUTES.BATCH_NEW}>
            <Plus className="h-4 w-4" />
            Initiate Batch
          </Link>
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={activeStatus} onValueChange={(v) => setActiveStatus(v as BatchStatus)}>
        <TabsList className="bg-gray-100/80">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Batches Table */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">
            {activeStatus === "all" ? "All Batches" : `${STATUS_TABS.find(t => t.value === activeStatus)?.label} Batches`}
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            {isLoading ? "Loading..." : `${batches.length} batch${batches.length !== 1 ? "es" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <FlaskConical className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No batches found</p>
              <p className="text-xs text-gray-400">
                Initiate a batch from an approved MBR to start manufacturing.
              </p>
              <Button asChild size="sm" className="mt-3 gap-2">
                <Link href={ROUTES.BATCH_NEW}>
                  <Plus className="h-3.5 w-3.5" />
                  Initiate Batch
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-100 bg-gray-50/50">
                  <TableHead className="pl-6 text-xs font-medium text-gray-500">Batch Number</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Product</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">MBR Code</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Manufacturing Date</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Initiated By</TableHead>
                  <TableHead className="text-xs font-medium text-gray-500">Deviations</TableHead>
                  <TableHead className="pr-6 text-right text-xs font-medium text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow
                    key={batch.id}
                    className="cursor-pointer border-gray-100 hover:bg-gray-50/50"
                    onClick={() => router.push(ROUTES.BATCH_DETAIL(batch.id))}
                  >
                    <TableCell className="pl-6 font-mono text-xs font-medium text-gray-700">
                      {batch.batchNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      <span className="font-medium">{batch.mbr?.product?.productName}</span>
                      {batch.mbr?.product?.strength && (
                        <span className="ml-1 text-xs text-gray-400">{batch.mbr.product.strength}</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {batch.mbr?.mbrCode}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${
                          BATCH_STATUS_COLORS[batch.status as keyof typeof BATCH_STATUS_COLORS] ?? "bg-gray-100 text-gray-600"
                        } border-transparent`}
                      >
                        {BATCH_STATUS_LABELS[batch.status as keyof typeof BATCH_STATUS_LABELS] ?? batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {batch.manufacturingDate
                        ? new Date(batch.manufacturingDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {batch.initiatedBy?.name ?? batch.initiatedBy?.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {batch._count?.deviations ?? 0 > 0 ? (
                        <Badge variant="outline" className="text-xs border bg-red-50 text-red-600 border-red-200">
                          {batch._count?.deviations}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">{batch._count?.deviations ?? 0}</span>
                      )}
                    </TableCell>
                    <TableCell
                      className="pr-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button asChild size="sm" variant="ghost" className="gap-1.5">
                        <Link href={ROUTES.BATCH_DETAIL(batch.id)}>
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
