"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { materialSchema, type MaterialFormValues } from "@/features/materials/schemas/material.schema"
import { ROUTES } from "@/shared/constants/routes"

const MATERIAL_TYPES = [
  { value: "active",     label: "Active Ingredient" },
  { value: "excipient",  label: "Excipient" },
  { value: "packaging",  label: "Packaging Material" },
  { value: "consumable", label: "Consumable" },
]

const GRADE_OPTIONS = [
  { value: "IP",       label: "IP — Indian Pharmacopoeia" },
  { value: "BP",       label: "BP — British Pharmacopoeia" },
  { value: "USP",      label: "USP — US Pharmacopoeia" },
  { value: "In_house", label: "In-House Grade" },
]

const UNIT_OPTIONS = ["kg", "g", "mg", "L", "mL", "units", "pcs", "m", "cm"]

export default function NewMaterialPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
  })

  const onSubmit = async (data: MaterialFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.message ?? "Failed to create material")
        return
      }
      toast.success("Material created successfully")
      router.push(ROUTES.MATERIALS)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-gray-500">
          <Link href={ROUTES.MATERIALS}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Material</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new raw material, excipient, or packaging component.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Material Details</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Basic identification and classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="materialCode">Material Code *</Label>
                <Input
                  id="materialCode"
                  placeholder="e.g. MAT-001"
                  className="font-mono"
                  {...register("materialCode")}
                />
                {errors.materialCode && (
                  <p className="text-xs text-red-500">{errors.materialCode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="materialType">Material Type *</Label>
                <Select onValueChange={(v) => setValue("materialType", v as MaterialFormValues["materialType"])}>
                  <SelectTrigger id="materialType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAL_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.materialType && (
                  <p className="text-xs text-red-500">{errors.materialType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="materialName">Material Name *</Label>
              <Input
                id="materialName"
                placeholder="e.g. Amoxicillin Trihydrate"
                {...register("materialName")}
              />
              {errors.materialName && (
                <p className="text-xs text-red-500">{errors.materialName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                <Select onValueChange={(v) => setValue("unitOfMeasure", v)}>
                  <SelectTrigger id="unitOfMeasure">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitOfMeasure && (
                  <p className="text-xs text-red-500">{errors.unitOfMeasure.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pharmacoepialGrade">Pharmacopoeial Grade</Label>
                <Select onValueChange={(v) => setValue("pharmacoepialGrade", v as MaterialFormValues["pharmacoepialGrade"])}>
                  <SelectTrigger id="pharmacoepialGrade">
                    <SelectValue placeholder="Select grade (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_OPTIONS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading} className="gap-2 bg-black text-white hover:bg-gray-800">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Material"
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.MATERIALS}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
