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
import { equipmentSchema, type EquipmentFormValues } from "@/features/equipment/schemas/equipment.schema"
import { ROUTES } from "@/shared/constants/routes"

const EQUIPMENT_TYPES = [
  "Blender / Mixer",
  "Granulator",
  "Tablet Press",
  "Coating Machine",
  "Capsule Filling Machine",
  "Autoclave / Sterilizer",
  "Oven / Dryer",
  "Filling Machine",
  "Sealing Machine",
  "HPLC / Analytical",
  "Weighing Balance",
  "Water Purification System",
  "Refrigerator / Cold Storage",
  "Other",
]

export default function NewEquipmentPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [customType, setCustomType] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
  })

  const onSubmit = async (data: EquipmentFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.message ?? "Failed to create equipment")
        return
      }
      toast.success("Equipment registered successfully")
      router.push(ROUTES.EQUIPMENT)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-gray-500">
          <Link href={ROUTES.EQUIPMENT}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Equipment</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new piece of manufacturing equipment with calibration schedule.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Identity */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Equipment Identity</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Code, name, and type classification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="equipmentCode">Equipment Code *</Label>
                <Input
                  id="equipmentCode"
                  placeholder="e.g. EQ-001"
                  className="font-mono"
                  {...register("equipmentCode")}
                />
                {errors.equipmentCode && (
                  <p className="text-xs text-red-500">{errors.equipmentCode.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Equipment Type *</Label>
                {customType ? (
                  <Input
                    placeholder="Enter custom type"
                    {...register("equipmentType")}
                  />
                ) : (
                  <Select
                    onValueChange={(v) => {
                      if (v === "Other") {
                        setCustomType(true)
                        setValue("equipmentType", "")
                      } else {
                        setValue("equipmentType", v)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EQUIPMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.equipmentType && (
                  <p className="text-xs text-red-500">{errors.equipmentType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="equipmentName">Equipment Name *</Label>
              <Input
                id="equipmentName"
                placeholder="e.g. High-Shear Granulator Unit 1"
                {...register("equipmentName")}
              />
              {errors.equipmentName && (
                <p className="text-xs text-red-500">{errors.equipmentName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Production Area B"
                  {...register("location")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  placeholder="e.g. 200L, 500 tabs/min"
                  {...register("capacity")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calibration */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Calibration Schedule</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              GMP requires calibration records to be maintained
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lastCalibrationDate">Last Calibration Date</Label>
                <Input
                  id="lastCalibrationDate"
                  type="date"
                  {...register("lastCalibrationDate")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextCalibrationDate">Next Calibration Due</Label>
                <Input
                  id="nextCalibrationDate"
                  type="date"
                  {...register("nextCalibrationDate")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isLoading} className="gap-2 bg-black text-white hover:bg-gray-800">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register Equipment"
            )}
          </Button>
          <Button asChild variant="outline">
            <Link href={ROUTES.EQUIPMENT}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
