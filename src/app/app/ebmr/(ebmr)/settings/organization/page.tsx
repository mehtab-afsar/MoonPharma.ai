"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/shared/constants/routes"

const orgSchema = z.object({
  name: z.string().min(2, "Organization name required"),
  licenseNumber: z.string().optional(),
  address: z.string().optional(),
  gmpCertificateNumber: z.string().optional(),
})

type OrgForm = z.infer<typeof orgSchema>

export default function OrganizationSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  })

  useEffect(() => {
    fetch("/api/organizations")
      .then(r => r.json())
      .then(result => {
        if (result.success) {
          reset({
            name: result.data.name ?? "",
            licenseNumber: result.data.licenseNumber ?? "",
            address: result.data.address ?? "",
            gmpCertificateNumber: result.data.gmpCertificateNumber ?? "",
          })
        }
      })
      .finally(() => setLoading(false))
  }, [reset])

  const onSubmit = async (data: OrgForm) => {
    setSaving(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      reset(data) // Mark form as clean
      toast.success("Organization profile updated")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update organization")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <Link href={ROUTES.SETTINGS} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-3.5 w-3.5" />
          Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Update your facility information used in batch records.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="space-y-1.5">
          <Label>Organization Name *</Label>
          <Input placeholder="Acme Pharmaceuticals Ltd" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Drug Manufacturing License Number</Label>
          <Input placeholder="e.g. MFG-DL-2024-001" {...register("licenseNumber")} />
          <p className="text-xs text-gray-400">Printed on batch records as the regulatory identifier.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Facility Address</Label>
          <Input placeholder="Plot 12, Industrial Area, Mumbai 400001" {...register("address")} />
        </div>

        <div className="space-y-1.5">
          <Label>GMP Certificate Number</Label>
          <Input placeholder="GMP/WHO/2024/001" {...register("gmpCertificateNumber")} />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={saving || !isDirty} className="w-full">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
