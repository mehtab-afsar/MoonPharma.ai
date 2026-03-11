"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronLeft, CheckCircle, Package, ListOrdered, FlaskConical } from "lucide-react"
import type { MBRData } from "./MBRBuilderWizard"

interface Props {
  mbrId: string
  mbrData: MBRData
  onSubmitted: () => void
  onBack: () => void
}

export function MBRReviewStep({ mbrId, mbrData, onSubmitted, onBack }: Props) {
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/submit`, {
        method: "POST",
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message ?? "Failed to submit MBR for review")
        return
      }

      toast.success("MBR submitted for review successfully")
      onSubmitted()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">
            Review &amp; Submit
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Review the MBR details before submitting for QA approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
              <FlaskConical className="h-5 w-5 text-blue-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">Product</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{mbrData.productName}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
              <CheckCircle className="h-5 w-5 text-gray-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">Batch Size</p>
              <p className="text-sm font-semibold text-gray-900">
                {Number(mbrData.batchSizeValue).toLocaleString()} {mbrData.batchSizeUnit}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
              <Package className="h-5 w-5 text-orange-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">Materials</p>
              <p className="text-sm font-semibold text-gray-900">{mbrData.materialCount} items</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
              <ListOrdered className="h-5 w-5 text-green-400 mx-auto mb-1.5" />
              <p className="text-xs text-gray-500">Steps</p>
              <p className="text-sm font-semibold text-gray-900">{mbrData.stepCount} steps</p>
            </div>
          </div>

          <Separator />

          {/* Detail table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              MBR Details
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">MBR Code</span>
                <span className="font-mono font-medium text-gray-900">{mbrData.mbrCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50 text-gray-600">
                  Draft
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Batch Size</span>
                <span className="font-medium text-gray-900">
                  {Number(mbrData.batchSizeValue).toLocaleString()} {mbrData.batchSizeUnit}
                </span>
              </div>
              {mbrData.theoreticalYieldValue && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Theoretical Yield</span>
                  <span className="font-medium text-gray-900">
                    {Number(mbrData.theoreticalYieldValue).toLocaleString()} {mbrData.theoreticalYieldUnit}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Yield Limit Min</span>
                <span className="font-medium text-gray-900">{mbrData.yieldLimitMin}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Yield Limit Max</span>
                <span className="font-medium text-gray-900">{mbrData.yieldLimitMax}%</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-800">
            <p className="font-medium mb-1">Before submitting:</p>
            <ul className="list-disc list-inside space-y-1 text-xs text-yellow-700">
              <li>Ensure all materials have been correctly specified with quantities and tolerances.</li>
              <li>Verify all manufacturing steps have clear instructions.</li>
              <li>Confirm process parameters and IPC checks are complete.</li>
              <li>Once submitted, the MBR will be locked pending QA review.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Submit for Review
        </Button>
      </div>
    </div>
  )
}
