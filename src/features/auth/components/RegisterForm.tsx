"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { registerOrgSchema, type RegisterOrgInput } from "@/features/auth/schemas/auth.schemas"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrgInput>({
    resolver: zodResolver(registerOrgSchema),
  })

  const onSubmit = async (data: RegisterOrgInput) => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!result.success) {
        toast.error(result.message || "Registration failed")
        return
      }

      // Auto sign-in and redirect to onboarding
      const signInResult = await signIn("credentials", {
        email: data.adminEmail,
        password: data.adminPassword,
        redirect: false,
      })

      if (signInResult?.ok) {
        toast.success("Organization created! Let's set up your facility.")
        router.push("/onboarding")
      } else {
        toast.success("Organization created! Please sign in.")
        router.push("/login")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Organization Details</h2>
        <p className="text-sm text-gray-500">Your company information</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="orgName">Organization Name *</Label>
        <Input id="orgName" placeholder="Acme Pharmaceuticals Ltd" {...register("orgName")} />
        {errors.orgName && <p className="text-xs text-red-500">{errors.orgName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="licenseNumber">Drug Manufacturing License Number</Label>
        <Input id="licenseNumber" placeholder="e.g. MFG-12345" {...register("licenseNumber")} />
      </div>

      <Separator />

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Administrator Account</h2>
        <p className="text-sm text-gray-500">This account will have full system access</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="adminName">Full Name *</Label>
          <Input id="adminName" placeholder="Dr. Jane Smith" {...register("adminName")} />
          {errors.adminName && <p className="text-xs text-red-500">{errors.adminName.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adminEmployeeId">Employee ID *</Label>
          <Input id="adminEmployeeId" placeholder="EMP-001" {...register("adminEmployeeId")} />
          {errors.adminEmployeeId && <p className="text-xs text-red-500">{errors.adminEmployeeId.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="adminEmail">Email Address *</Label>
        <Input id="adminEmail" type="email" placeholder="admin@company.com" {...register("adminEmail")} />
        {errors.adminEmail && <p className="text-xs text-red-500">{errors.adminEmail.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="adminPassword">Password *</Label>
          <Input id="adminPassword" type="password" placeholder="Min 8 characters" {...register("adminPassword")} />
          {errors.adminPassword && <p className="text-xs text-red-500">{errors.adminPassword.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password *</Label>
          <Input id="confirmPassword" type="password" placeholder="Repeat password" {...register("confirmPassword")} />
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating organization...
          </>
        ) : (
          "Create Organization & Account"
        )}
      </Button>
    </form>
  )
}
