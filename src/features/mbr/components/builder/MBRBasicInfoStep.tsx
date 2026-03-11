"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { Loader2 } from "lucide-react"
import type { MBRData } from "./MBRBuilderWizard"

const BATCH_SIZE_UNITS = ["kg", "L", "tablets", "capsules", "g", "mL"]

interface FormValues {
  productId: string
  mbrCode: string
  batchSizeValue: string
  batchSizeUnit: string
  theoreticalYieldValue: string
  theoreticalYieldUnit: string
  yieldLimitMin: string
  yieldLimitMax: string
  effectiveDate: string
  reviewDate: string
}

interface Product {
  id: string
  productName: string
  productCode: string
  strength: string
  dosageForm: string
}

interface Props {
  onSaved: (mbrId: string, data: Partial<MBRData>) => void
}

export function MBRBasicInfoStep({ onSaved }: Props) {
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      batchSizeUnit: "kg",
      theoreticalYieldUnit: "kg",
      yieldLimitMin: "95",
      yieldLimitMax: "100",
    },
  })

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products")
        if (!res.ok) throw new Error("Failed to load products")
        const json = await res.json()
        setProducts(json.data ?? [])
      } catch {
        toast.error("Failed to load products")
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  async function onSubmit(values: FormValues) {
    if (!values.productId) {
      toast.error("Please select a product")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/mbr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: values.productId,
          mbrCode: values.mbrCode,
          batchSizeValue: Number(values.batchSizeValue),
          batchSizeUnit: values.batchSizeUnit,
          theoreticalYieldValue: values.theoreticalYieldValue ? Number(values.theoreticalYieldValue) : undefined,
          theoreticalYieldUnit: values.theoreticalYieldUnit || undefined,
          yieldLimitMin: Number(values.yieldLimitMin),
          yieldLimitMax: Number(values.yieldLimitMax),
          effectiveDate: values.effectiveDate || undefined,
          reviewDate: values.reviewDate || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message ?? "Failed to create MBR")
        return
      }

      const selectedProduct = products.find((p) => p.id === values.productId)
      onSaved(json.data.id, {
        productId: values.productId,
        productName: selectedProduct?.productName ?? "",
        mbrCode: values.mbrCode,
        batchSizeValue: Number(values.batchSizeValue),
        batchSizeUnit: values.batchSizeUnit,
        theoreticalYieldValue: values.theoreticalYieldValue ? Number(values.theoreticalYieldValue) : undefined,
        theoreticalYieldUnit: values.theoreticalYieldUnit || undefined,
        yieldLimitMin: Number(values.yieldLimitMin),
        yieldLimitMax: Number(values.yieldLimitMax),
      })

      toast.success("MBR created — continue adding materials")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Basic Information</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Select the product and define batch parameters.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product selector */}
          <div className="space-y-2">
            <Label htmlFor="productId">
              Product <span className="text-red-500">*</span>
            </Label>
            {loadingProducts ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading products...
              </div>
            ) : (
              <Select
                onValueChange={(value) => setValue("productId", value)}
                defaultValue=""
              >
                <SelectTrigger id="productId" className="w-full">
                  <SelectValue placeholder="Select a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="font-medium">{p.productName}</span>
                      <span className="ml-2 text-gray-400 text-xs">
                        {p.strength} · {p.dosageForm}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* MBR Code */}
          <div className="space-y-2">
            <Label htmlFor="mbrCode">
              MBR Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mbrCode"
              placeholder="e.g. MBR-2024-001"
              {...register("mbrCode", { required: "MBR code is required" })}
            />
            {errors.mbrCode && (
              <p className="text-xs text-red-500">{errors.mbrCode.message}</p>
            )}
          </div>

          {/* Batch Size */}
          <div className="space-y-2">
            <Label>
              Batch Size <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 100"
                className="flex-1"
                {...register("batchSizeValue", { required: "Batch size is required" })}
              />
              <Select
                defaultValue="kg"
                onValueChange={(value) => setValue("batchSizeUnit", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_SIZE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {errors.batchSizeValue && (
              <p className="text-xs text-red-500">{errors.batchSizeValue.message}</p>
            )}
          </div>

          {/* Theoretical Yield */}
          <div className="space-y-2">
            <Label>Theoretical Yield (optional)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="any"
                placeholder="e.g. 98"
                className="flex-1"
                {...register("theoreticalYieldValue")}
              />
              <Select
                defaultValue="kg"
                onValueChange={(value) => setValue("theoreticalYieldUnit", value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BATCH_SIZE_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Yield Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yieldLimitMin">Yield Limit Min (%)</Label>
              <Input
                id="yieldLimitMin"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("yieldLimitMin")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yieldLimitMax">Yield Limit Max (%)</Label>
              <Input
                id="yieldLimitMax"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("yieldLimitMax")}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date (optional)</Label>
              <Input id="effectiveDate" type="date" {...register("effectiveDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewDate">Review Date (optional)</Label>
              <Input id="reviewDate" type="date" {...register("reviewDate")} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
