"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, FlaskConical, Plus, ArrowRight } from "lucide-react"

const STATUS_STYLES: Record<string, string> = {
  planned:       "bg-gray-100 text-gray-600 border-gray-200",
  in_progress:   "bg-gray-100 text-gray-800 border-gray-300",
  completed:     "bg-gray-900 text-white border-gray-900",
  under_review:  "bg-gray-200 text-gray-700 border-gray-300",
  approved:      "bg-black text-white border-black",
  rejected:      "bg-white text-gray-500 border-gray-200 line-through",
  on_hold:       "bg-gray-50 text-gray-500 border-gray-200",
}

const STATUS_LABELS: Record<string, string> = {
  planned:      "Planned",
  in_progress:  "In Progress",
  completed:    "Completed",
  under_review: "Under Review",
  approved:     "Approved",
  rejected:     "Rejected",
  on_hold:      "On Hold",
}

function formatDate(d: Date | string): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "2-digit" }).format(date)
}

interface Batch {
  id: string
  batchNumber: string
  status: string
  createdAt: Date
  mbr: {
    product: {
      productName: string
      strength?: string | null
      dosageForm?: string | null
    }
  }
  initiatedBy: { fullName: string | null }
  _count: { deviations: number }
}

function AnimatedRow({ batch, index }: { batch: Batch; index: number }) {
  const ref = useRef<HTMLTableRowElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setVisible(true), index * 60)
    return () => clearTimeout(timeout)
  }, [index])

  return (
    <TableRow
      ref={ref}
      className="border-gray-100 hover:bg-gray-50/60 transition-colors"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(24px)",
        transition: `opacity 300ms ease-out ${index * 60}ms, transform 300ms ease-out ${index * 60}ms`,
      }}
    >
      <TableCell className="py-3.5 pl-6">
        <span className="font-mono text-sm font-semibold text-gray-900">
          {batch.batchNumber}
        </span>
      </TableCell>
      <TableCell className="py-3.5">
        <div>
          <p className="text-sm font-medium text-gray-900">{batch.mbr.product.productName}</p>
          <p className="text-xs text-gray-400">
            {batch.mbr.product.strength}
            {batch.mbr.product.dosageForm && ` · ${batch.mbr.product.dosageForm}`}
          </p>
        </div>
      </TableCell>
      <TableCell className="py-3.5">
        <span
          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${
            STATUS_STYLES[batch.status] ?? "bg-gray-100 text-gray-700 border-gray-200"
          }`}
        >
          {STATUS_LABELS[batch.status] ?? batch.status}
        </span>
      </TableCell>
      <TableCell className="py-3.5">
        {batch._count.deviations > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700">
            <AlertTriangle className="h-3 w-3" />
            {batch._count.deviations}
          </span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </TableCell>
      <TableCell className="py-3.5 text-sm text-gray-600">
        {batch.initiatedBy.fullName ?? "—"}
      </TableCell>
      <TableCell className="py-3.5 text-sm text-gray-500 font-mono text-xs">
        {formatDate(batch.createdAt)}
      </TableCell>
      <TableCell className="py-3.5 pr-6 text-right">
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs gap-1 hover:bg-gray-100">
          <Link href={`/batches/${batch.id}`}>
            View
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function RecentBatchesTable({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-none">
        <CardContent className="py-16 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <FlaskConical className="h-6 w-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">No batches yet</p>
          <p className="text-xs text-gray-400">Start your first batch to see it here.</p>
          <Button asChild size="sm" className="mt-1 gap-2 bg-black text-white hover:bg-gray-800 btn-press">
            <Link href="/batches/new">
              <Plus className="h-3.5 w-3.5" />
              Start New Batch
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-gray-200 shadow-none overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-100 bg-gray-900 hover:bg-gray-900">
              <TableHead className="pl-6 text-xs font-semibold text-white/70 uppercase tracking-wide">Batch #</TableHead>
              <TableHead className="text-xs font-semibold text-white/70 uppercase tracking-wide">Product</TableHead>
              <TableHead className="text-xs font-semibold text-white/70 uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs font-semibold text-white/70 uppercase tracking-wide">Deviations</TableHead>
              <TableHead className="text-xs font-semibold text-white/70 uppercase tracking-wide">Started By</TableHead>
              <TableHead className="text-xs font-semibold text-white/70 uppercase tracking-wide">Date</TableHead>
              <TableHead className="pr-6 text-right text-xs font-semibold text-white/70 uppercase tracking-wide">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch, i) => (
              <AnimatedRow key={batch.id} batch={batch} index={i} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
