"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, ChevronRight, Building2, Users, FlaskConical, Package, Wrench, ArrowRight, Loader2, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DOSAGE_FORMS, MATERIAL_TYPES, EQUIPMENT_TYPES } from "@/shared/constants/pharma.constants"

// ─── Schemas ────────────────────────────────────────────────────────────────

const facilitySchema = z.object({
  address: z.string().min(5, "Address required"),
  gmpCertificateNumber: z.string().optional(),
})

const teamMemberSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  employeeId: z.string().min(1, "Employee ID required"),
  role: z.enum(["supervisor", "operator", "qa_reviewer", "qa_head", "production_head"]),
  password: z.string().min(8, "Min 8 characters"),
  pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d{4}$/, "Digits only"),
})

const productSchema = z.object({
  productCode: z.string().min(1, "Product code required"),
  productName: z.string().min(2, "Product name required"),
  genericName: z.string().optional(),
  strength: z.string().min(1, "Strength required"),
  dosageForm: z.string().min(1, "Dosage form required"),
})

const materialSchema = z.object({
  materialName: z.string().min(2, "Material name required"),
  materialCode: z.string().min(1, "Material code required"),
  materialType: z.string().min(1, "Type required"),
  unitOfMeasure: z.string().min(1, "Unit required"),
})

const equipmentSchema = z.object({
  equipmentName: z.string().min(2, "Equipment name required"),
  equipmentCode: z.string().min(1, "Code required"),
  equipmentType: z.string().min(1, "Type required"),
  location: z.string().optional(),
})

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = "facility" | "config" | "team" | "product" | "materials" | "equipment" | "done"

const STEPS: { id: Step; label: string; sublabel: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "facility", label: "Facility", sublabel: "Setup your plant profile", icon: Building2 },
  { id: "config", label: "Configuration", sublabel: "Set workflow & numbering", icon: Settings2 },
  { id: "team", label: "Team", sublabel: "Add your first users", icon: Users },
  { id: "product", label: "Product", sublabel: "Register your first product", icon: FlaskConical },
  { id: "materials", label: "Materials", sublabel: "Add raw materials", icon: Package },
  { id: "equipment", label: "Equipment", sublabel: "Register equipment", icon: Wrench },
]

const STEP_ORDER: Step[] = ["facility", "config", "team", "product", "materials", "equipment", "done"]

// ─── Facility Step ───────────────────────────────────────────────────────────

function FacilityStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof facilitySchema>>({
    resolver: zodResolver(facilitySchema),
  })

  const onSubmit = async (data: z.infer<typeof facilitySchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Facility profile saved")
      onNext()
    } catch {
      toast.error("Failed to save facility profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Facility Address</Label>
        <Input placeholder="Plot 12, Industrial Area, Mumbai 400001" {...register("address")} />
        {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>GMP Certificate Number <span className="text-gray-400">(optional)</span></Label>
        <Input placeholder="GMP/MFG/2024/001" {...register("gmpCertificateNumber")} />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Save & Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  )
}

// ─── Config Step ─────────────────────────────────────────────────────────────

const configStepSchema = z.object({
  batchPrefix: z.string().min(1).max(10),
  batchNumberReset: z.enum(["yearly", "monthly", "never"]),
  deviationPrefix: z.string().min(1).max(10),
  qaReviewStages: z.number().int().min(2).max(3),
  eSignatureMethod: z.enum(["pin_only", "password_only", "pin_and_password"]),
  autoDeviationOnOos: z.boolean(),
})

function ConfigStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, watch } = useForm<z.infer<typeof configStepSchema>>({
    resolver: zodResolver(configStepSchema),
    defaultValues: {
      batchPrefix: "B",
      batchNumberReset: "yearly",
      deviationPrefix: "DEV",
      qaReviewStages: 2,
      eSignatureMethod: "pin_only",
      autoDeviationOnOos: true,
    },
  })

  const autoDeviation = watch("autoDeviationOnOos")

  const onSubmit = async (data: z.infer<typeof configStepSchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Configuration saved")
      onNext()
    } catch {
      toast.error("Failed to save configuration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Batch Prefix</Label>
          <Input placeholder="B" {...register("batchPrefix")} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Batch Reset Cycle</Label>
          <select {...register("batchNumberReset")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
            <option value="yearly">Yearly</option>
            <option value="monthly">Monthly</option>
            <option value="never">Never</option>
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Deviation Prefix</Label>
        <Input placeholder="DEV" {...register("deviationPrefix")} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">QA Review Stages</Label>
        <div className="flex gap-4">
          {[2, 3].map((n) => (
            <label key={n} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" value={n} {...register("qaReviewStages", { valueAsNumber: true })} className="rounded" />
              {n} stages
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">E-Signature Method</Label>
        <div className="flex flex-col gap-2">
          {[
            { value: "pin_only", label: "PIN only" },
            { value: "password_only", label: "Password only" },
            { value: "pin_and_password", label: "PIN + Password" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="radio" value={opt.value} {...register("eSignatureMethod")} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
          <button
            type="button"
            onClick={() => setValue("autoDeviationOnOos", !autoDeviation)}
            className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${autoDeviation ? "bg-black" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${autoDeviation ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
          Auto-create deviation on OOS result
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onNext} className="flex-1">
          Skip
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save & Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

// ─── Team Step ───────────────────────────────────────────────────────────────

function TeamStep({ onNext }: { onNext: () => void }) {
  const [members, setMembers] = useState<Array<{ name: string; role: string; email: string }>>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof teamMemberSchema>>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { role: "operator" },
  })

  const onAddMember = async (data: z.infer<typeof teamMemberSchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setMembers(prev => [...prev, { name: data.fullName, role: data.role, email: data.email }])
      toast.success(`${data.fullName} added`)
      reset()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add team member")
    } finally {
      setLoading(false)
    }
  }

  const ROLES = [
    { value: "production_head", label: "Production Head" },
    { value: "supervisor", label: "Supervisor" },
    { value: "operator", label: "Operator" },
    { value: "qa_reviewer", label: "QA Reviewer" },
    { value: "qa_head", label: "QA Head" },
  ]

  return (
    <div className="space-y-6">
      {members.length > 0 && (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                {m.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-gray-500">{m.email}</p>
              </div>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{m.role}</span>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onAddMember)} className="space-y-4 border border-dashed border-gray-300 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700">Add Team Member</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name *</Label>
            <Input placeholder="Dr. Jane Smith" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Employee ID *</Label>
            <Input placeholder="EMP-002" {...register("employeeId")} />
            {errors.employeeId && <p className="text-xs text-red-500">{errors.employeeId.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email *</Label>
          <Input type="email" placeholder="jane@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role *</Label>
          <select {...register("role")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Password *</Label>
            <Input type="password" placeholder="Min 8 chars" {...register("password")} />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">4-Digit PIN *</Label>
            <Input type="password" maxLength={4} placeholder="e.g. 1234" {...register("pin")} />
            {errors.pin && <p className="text-xs text-red-500">{errors.pin.message}</p>}
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
          Add Team Member
        </Button>
      </form>

      <Button onClick={onNext} className="w-full">
        {members.length === 0 ? "Skip for now" : "Continue"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Product Step ─────────────────────────────────────────────────────────────

function ProductStep({ onNext }: { onNext: () => void }) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  })

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      toast.success(`${data.productName} registered`)
      onNext()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Product Code *</Label>
          <Input placeholder="e.g. PRD-001" {...register("productCode")} />
          {errors.productCode && <p className="text-xs text-red-500">{errors.productCode.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Amoxicillin Capsules" {...register("productName")} />
          {errors.productName && <p className="text-xs text-red-500">{errors.productName.message}</p>}
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Generic Name</Label>
          <Input placeholder="e.g. Amoxicillin" {...register("genericName")} />
        </div>
        <div className="space-y-1.5">
          <Label>Strength *</Label>
          <Input placeholder="e.g. 500mg" {...register("strength")} />
          {errors.strength && <p className="text-xs text-red-500">{errors.strength.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Dosage Form *</Label>
          <select {...register("dosageForm")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
            <option value="">Select form</option>
            {DOSAGE_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          {errors.dosageForm && <p className="text-xs text-red-500">{errors.dosageForm.message}</p>}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onNext} className="flex-1">
          Skip
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save & Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}

// ─── Materials Step ───────────────────────────────────────────────────────────

function MaterialsStep({ onNext }: { onNext: () => void }) {
  const [added, setAdded] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: { materialType: "active", unitOfMeasure: "kg" },
  })

  const onAdd = async (data: z.infer<typeof materialSchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setAdded(prev => [...prev, data.materialName])
      toast.success(`${data.materialName} added`)
      reset()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add material")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {added.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {added.map((name, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
              <Check className="h-3 w-3 text-green-600" />
              {name}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onAdd)} className="space-y-3 border border-dashed border-gray-300 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700">Add Raw Material / Excipient</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Material Name *</Label>
            <Input placeholder="Amoxicillin Trihydrate" {...register("materialName")} />
            {errors.materialName && <p className="text-xs text-red-500">{errors.materialName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Material Code *</Label>
            <Input placeholder="RM-001" {...register("materialCode")} />
            {errors.materialCode && <p className="text-xs text-red-500">{errors.materialCode.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Type *</Label>
            <select {...register("materialType")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
              {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Unit of Measure *</Label>
            <select {...register("unitOfMeasure")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
              {["kg", "g", "mg", "L", "mL", "units", "nos"].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
          Add Material
        </Button>
      </form>

      <Button onClick={onNext} className="w-full">
        {added.length === 0 ? "Skip for now" : "Continue"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Equipment Step ───────────────────────────────────────────────────────────

function EquipmentStep({ onNext }: { onNext: () => void }) {
  const [added, setAdded] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof equipmentSchema>>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: { equipmentType: EQUIPMENT_TYPES[0] },
  })

  const onAdd = async (data: z.infer<typeof equipmentSchema>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!result.success) throw new Error(result.message)
      setAdded(prev => [...prev, data.equipmentName])
      toast.success(`${data.equipmentName} registered`)
      reset()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add equipment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {added.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {added.map((name, i) => (
            <span key={i} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
              <Check className="h-3 w-3 text-green-600" />
              {name}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit(onAdd)} className="space-y-3 border border-dashed border-gray-300 rounded-xl p-4">
        <p className="text-sm font-medium text-gray-700">Register Equipment</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Equipment Name *</Label>
            <Input placeholder="RMG-01" {...register("equipmentName")} />
            {errors.equipmentName && <p className="text-xs text-red-500">{errors.equipmentName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Equipment Code *</Label>
            <Input placeholder="EQ-001" {...register("equipmentCode")} />
            {errors.equipmentCode && <p className="text-xs text-red-500">{errors.equipmentCode.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Equipment Type *</Label>
            <select {...register("equipmentType")} className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-black">
              {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input placeholder="Manufacturing Block A" {...register("location")} />
          </div>
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={loading} className="w-full">
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
          Add Equipment
        </Button>
      </form>

      <Button onClick={onNext} className="w-full">
        {added.length === 0 ? "Skip for now" : "Finish Setup"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}

// ─── Done Step ────────────────────────────────────────────────────────────────

function DoneStep() {
  const router = useRouter()

  return (
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto">
        <Check className="h-8 w-8 text-white" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900">You&apos;re all set!</h3>
        <p className="text-sm text-gray-500 mt-2">
          Your facility is configured. You can now create your first Master Batch Record and start executing batches.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="w-full" onClick={() => router.push("/platform")}>
          Go to Platform
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="outline" className="w-full" onClick={() => router.push("/mbr/new")}>
          Create First MBR
        </Button>
        <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>("facility")

  const currentIndex = STEP_ORDER.indexOf(currentStep)
  const isDone = currentStep === "done"

  const goNext = () => {
    const nextIndex = currentIndex + 1
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex])
    }
  }

  const activeStepMeta = STEPS.find(s => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 pb-16 px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full mb-4">
            Setup Wizard
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Configure your facility</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complete these steps to start executing batch manufacturing records.
          </p>
        </div>

        {/* Step Progress */}
        {!isDone && (
          <div className="flex items-center gap-1 mb-8">
            {STEPS.map((step, i) => {
              const stepIndex = STEP_ORDER.indexOf(step.id)
              const isCompleted = currentIndex > stepIndex
              const isCurrent = step.id === currentStep

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                    transition-all duration-300
                    ${isCompleted ? "bg-black text-white" : isCurrent ? "bg-gray-900 text-white ring-4 ring-gray-900/20" : "bg-gray-200 text-gray-500"}
                  `}>
                    {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-all duration-500 ${isCompleted ? "bg-black" : "bg-gray-200"}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          {!isDone && activeStepMeta && (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <activeStepMeta.icon className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{activeStepMeta.label}</h2>
                  <p className="text-xs text-gray-500">{activeStepMeta.sublabel}</p>
                </div>
              </div>
            </div>
          )}

          {currentStep === "facility" && <FacilityStep onNext={goNext} />}
          {currentStep === "config" && <ConfigStep onNext={goNext} />}
          {currentStep === "team" && <TeamStep onNext={goNext} />}
          {currentStep === "product" && <ProductStep onNext={goNext} />}
          {currentStep === "materials" && <MaterialsStep onNext={goNext} />}
          {currentStep === "equipment" && <EquipmentStep onNext={goNext} />}
          {currentStep === "done" && <DoneStep />}
        </div>

        {/* Step labels */}
        {!isDone && (
          <div className="mt-4 flex justify-center">
            <p className="text-xs text-gray-400">
              Step {currentIndex + 1} of {STEPS.length} — {activeStepMeta?.label}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
