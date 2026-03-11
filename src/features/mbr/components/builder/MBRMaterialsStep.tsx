"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Trash2, Loader2, ChevronLeft, Package } from "lucide-react"
import { MANUFACTURING_STAGES } from "@/shared/constants/pharma.constants"

interface Material {
  id: string
  materialName: string
  materialCode: string
  materialType: string
  unitOfMeasure: string
}

interface MBRMaterial {
  id: string
  materialId: string
  material: Material
  quantity: number
  unit: string
  tolerancePlus?: number
  toleranceMinus?: number
  stage?: string
  sequenceOrder: number
  isCritical: boolean
}

interface AddMaterialForm {
  materialId: string
  quantity: string
  unit: string
  tolerancePlus: string
  toleranceMinus: string
  stage: string
  isCritical: boolean
}

interface Props {
  mbrId: string
  onComplete: (count: number) => void
  onBack: () => void
}

export function MBRMaterialsStep({ mbrId, onComplete, onBack }: Props) {
  const [materials, setMaterials] = useState<MBRMaterial[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, reset } = useForm<AddMaterialForm>({
    defaultValues: {
      unit: "kg",
      tolerancePlus: "2",
      toleranceMinus: "2",
      isCritical: false,
    },
  })

  const isCritical = watch("isCritical")

  useEffect(() => {
    async function fetchData() {
      try {
        const [mbrRes, matRes] = await Promise.all([
          fetch(`/api/mbr/${mbrId}/materials`),
          fetch("/api/materials"),
        ])
        const mbrJson = await mbrRes.json()
        const matJson = await matRes.json()
        setMaterials(mbrJson.data ?? [])
        setAvailableMaterials(matJson.data ?? [])
      } catch {
        toast.error("Failed to load data")
      } finally {
        setLoadingMaterials(false)
      }
    }
    fetchData()
  }, [mbrId])

  async function onAddMaterial(values: AddMaterialForm) {
    if (!values.materialId) {
      toast.error("Please select a material")
      return
    }

    setAdding(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/materials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: values.materialId,
          quantity: Number(values.quantity),
          unit: values.unit,
          tolerancePlus: values.tolerancePlus ? Number(values.tolerancePlus) : undefined,
          toleranceMinus: values.toleranceMinus ? Number(values.toleranceMinus) : undefined,
          stage: values.stage || undefined,
          sequenceOrder: materials.length + 1,
          isCritical: values.isCritical,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.message ?? "Failed to add material")
        return
      }

      setMaterials((prev) => [...prev, json.data])
      toast.success("Material added")
      reset({ unit: "kg", tolerancePlus: "2", toleranceMinus: "2", isCritical: false })
      setShowAddForm(false)
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setAdding(false)
    }
  }

  async function handleDeleteMaterial(mbrMaterialId: string) {
    setDeletingId(mbrMaterialId)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/materials/${mbrMaterialId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        toast.error("Failed to remove material")
        return
      }

      setMaterials((prev) => prev.filter((m) => m.id !== mbrMaterialId))
      toast.success("Material removed")
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  if (loadingMaterials) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Bill of Materials
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Add all raw materials, excipients, and packaging required for this batch.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAddForm((v) => !v)}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Material
            </Button>
          </div>
        </CardHeader>

        {showAddForm && (
          <>
            <Separator />
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onAddMaterial)} className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 space-y-4">
                  <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    New Material Entry
                  </p>

                  {/* Material selector */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Material <span className="text-red-500">*</span>
                    </Label>
                    <Select onValueChange={(value) => setValue("materialId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaterials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="font-medium">{m.materialName}</span>
                            <span className="ml-2 text-gray-400 text-xs">
                              {m.materialCode} · {m.materialType}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Qty + Unit */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">
                        Quantity <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g. 50"
                        {...register("quantity", { required: true })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Unit</Label>
                      <Input placeholder="kg, g, mL..." {...register("unit")} />
                    </div>
                  </div>

                  {/* Tolerance */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tolerance + (%)</Label>
                      <Input type="number" step="0.01" {...register("tolerancePlus")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tolerance - (%)</Label>
                      <Input type="number" step="0.01" {...register("toleranceMinus")} />
                    </div>
                  </div>

                  {/* Stage */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Manufacturing Stage</Label>
                    <Select onValueChange={(value) => setValue("stage", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUFACTURING_STAGES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Critical */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isCritical"
                      checked={isCritical}
                      onCheckedChange={(checked) => setValue("isCritical", Boolean(checked))}
                    />
                    <Label htmlFor="isCritical" className="text-xs cursor-pointer">
                      Critical material (requires double verification)
                    </Label>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={adding} className="gap-1.5">
                      {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Add Material
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </>
        )}

        <CardContent className={showAddForm ? "pt-0" : "pt-0 pb-0"}>
          {materials.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Package className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">No materials added yet.</p>
              <p className="text-xs text-gray-400">Click &quot;Add Material&quot; above to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {materials.map((m, idx) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-3 first:pt-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.material.materialName}
                        {m.isCritical && (
                          <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-600 bg-orange-50">
                            Critical
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {Number(m.quantity).toLocaleString()} {m.unit}
                        {m.tolerancePlus !== undefined && m.toleranceMinus !== undefined && (
                          <span className="ml-2">
                            (±{m.tolerancePlus}/{m.toleranceMinus}%)
                          </span>
                        )}
                        {m.stage && <span className="ml-2 text-gray-400">· {m.stage}</span>}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-400 hover:text-red-500"
                    disabled={deletingId === m.id}
                    onClick={() => handleDeleteMaterial(m.id)}
                  >
                    {deletingId === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={() => onComplete(materials.length)}>
          Continue to Steps
        </Button>
      </div>
    </div>
  )
}
