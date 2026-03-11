"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, FlaskConical } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

interface MBR {
  id: string
  mbrCode: string
  version: number
  batchSizeValue: number
  batchSizeUnit: string
  product: {
    productName: string
    strength?: string | null
    dosageForm?: string | null
  }
}

async function fetchApprovedMBRs(): Promise<MBR[]> {
  const res = await fetch("/api/mbr?status=approved")
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? []
}

export default function InitiateBatchPage() {
  const router = useRouter()

  const [mbrs, setMbrs] = useState<MBR[]>([])
  const [loadingMbrs, setLoadingMbrs] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedMbrId, setSelectedMbrId] = useState("")
  const [manufacturingDate, setManufacturingDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")

  useEffect(() => {
    fetchApprovedMBRs()
      .then(setMbrs)
      .finally(() => setLoadingMbrs(false))
  }, [])

  const selectedMbr = mbrs.find((m) => m.id === selectedMbrId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedMbrId) {
      toast.error("Please select an MBR.")
      return
    }
    if (!manufacturingDate) {
      toast.error("Manufacturing date is required.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        mbrId: selectedMbrId,
        manufacturingDate: new Date(manufacturingDate).toISOString(),
      }
      if (expiryDate) {
        payload.expiryDate = new Date(expiryDate).toISOString()
      }

      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.message ?? "Failed to initiate batch.")
        return
      }

      toast.success("Batch initiated successfully.")
      router.push(ROUTES.BATCH_EXECUTE(result.data?.id ?? result.id))
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-gray-600">
          <Link href={ROUTES.BATCHES}>
            <ArrowLeft className="h-4 w-4" />
            Back to Batches
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Initiate Batch</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select an approved MBR and provide manufacturing details to initiate a new batch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* MBR Selection */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Master Batch Record
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Select an approved MBR to manufacture against.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mbr-select">
                MBR <span className="text-red-500">*</span>
              </Label>
              {loadingMbrs ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading approved MBRs...
                </div>
              ) : mbrs.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                  <FlaskConical className="h-4 w-4 shrink-0" />
                  No approved MBRs found. An MBR must be approved before initiating a batch.
                </div>
              ) : (
                <Select value={selectedMbrId} onValueChange={setSelectedMbrId}>
                  <SelectTrigger id="mbr-select">
                    <SelectValue placeholder="Select an MBR..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mbrs.map((mbr) => (
                      <SelectItem key={mbr.id} value={mbr.id}>
                        <span className="font-medium">{mbr.product.productName}</span>
                        {mbr.product.strength && (
                          <span className="ml-1 text-gray-500">{mbr.product.strength}</span>
                        )}
                        <span className="ml-2 font-mono text-xs text-gray-400">
                          {mbr.mbrCode} v{mbr.version}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedMbr && (
              <div className="rounded-md border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Selected MBR Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>{" "}
                    <span className="font-medium text-gray-800">
                      {selectedMbr.product.productName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Strength:</span>{" "}
                    <span className="text-gray-800">{selectedMbr.product.strength ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dosage Form:</span>{" "}
                    <span className="text-gray-800">{selectedMbr.product.dosageForm ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Batch Size:</span>{" "}
                    <span className="text-gray-800">
                      {Number(selectedMbr.batchSizeValue).toLocaleString()} {selectedMbr.batchSizeUnit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">MBR Code:</span>{" "}
                    <span className="font-mono text-gray-800">{selectedMbr.mbrCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Version:</span>{" "}
                    <span className="text-gray-800">v{selectedMbr.version}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manufacturing Details */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-900">
              Manufacturing Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Provide the manufacturing and expiry dates for this batch.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manufacturing-date">
                Manufacturing Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manufacturing-date"
                type="date"
                value={manufacturingDate}
                onChange={(e) => setManufacturingDate(e.target.value)}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry-date">
                Expiry Date <span className="text-gray-400 text-xs">(optional)</span>
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={manufacturingDate || undefined}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || loadingMbrs || mbrs.length === 0} className="gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Initiate Batch
          </Button>
        </div>
      </form>
    </div>
  )
}
