"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MBRBasicInfoStep } from "./MBRBasicInfoStep"
import { MBRMaterialsStep } from "./MBRMaterialsStep"
import { MBRStepsStep } from "./MBRStepsStep"
import { MBRReviewStep } from "./MBRReviewStep"

const WIZARD_STEPS = [
  { id: 1, title: "Basic Info", description: "Product & batch details" },
  { id: 2, title: "Bill of Materials", description: "Ingredients & quantities" },
  { id: 3, title: "Manufacturing Steps", description: "Process steps & checks" },
  { id: 4, title: "Review & Submit", description: "Confirm and submit" },
]

export interface MBRData {
  productId: string
  productName: string
  mbrCode: string
  batchSizeValue: number
  batchSizeUnit: string
  theoreticalYieldValue?: number
  theoreticalYieldUnit?: string
  yieldLimitMin: number
  yieldLimitMax: number
  materialCount: number
  stepCount: number
}

export function MBRBuilderWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [mbrId, setMbrId] = useState<string | null>(null)
  const [mbrData, setMbrData] = useState<Partial<MBRData>>({
    yieldLimitMin: 95,
    yieldLimitMax: 100,
    materialCount: 0,
    stepCount: 0,
  })

  function handleBasicInfoSaved(id: string, data: Partial<MBRData>) {
    setMbrId(id)
    setMbrData((prev) => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  function handleMaterialsComplete(count: number) {
    setMbrData((prev) => ({ ...prev, materialCount: count }))
    setCurrentStep(3)
  }

  function handleStepsComplete(count: number) {
    setMbrData((prev) => ({ ...prev, stepCount: count }))
    setCurrentStep(4)
  }

  function handleSubmitted() {
    router.push("/mbr")
  }

  return (
    <div className="space-y-8">
      {/* Stepper */}
      <div className="flex items-start gap-0">
        {WIZARD_STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-start">
            <div className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    currentStep > step.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : currentStep === step.id
                      ? "border-blue-600 bg-white text-blue-600"
                      : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {currentStep > step.id ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>
                {index < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mx-2 transition-colors",
                      currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
              <div className="mt-2 text-left w-full pr-4">
                <p
                  className={cn(
                    "text-xs font-semibold",
                    currentStep === step.id ? "text-blue-600" : currentStep > step.id ? "text-gray-700" : "text-gray-400"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div>
        {currentStep === 1 && (
          <MBRBasicInfoStep onSaved={handleBasicInfoSaved} />
        )}
        {currentStep === 2 && mbrId && (
          <MBRMaterialsStep
            mbrId={mbrId}
            onComplete={handleMaterialsComplete}
            onBack={() => setCurrentStep(1)}
          />
        )}
        {currentStep === 3 && mbrId && (
          <MBRStepsStep
            mbrId={mbrId}
            onComplete={handleStepsComplete}
            onBack={() => setCurrentStep(2)}
          />
        )}
        {currentStep === 4 && mbrId && (
          <MBRReviewStep
            mbrId={mbrId}
            mbrData={mbrData as MBRData}
            onSubmitted={handleSubmitted}
            onBack={() => setCurrentStep(3)}
          />
        )}
      </div>
    </div>
  )
}
