"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MBRBuilderWizard } from "@/features/mbr/components/builder/MBRBuilderWizard"
import { ROUTES } from "@/shared/constants/routes"

export default function NewMBRPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900">
          <Link href={ROUTES.MBR}>
            <ChevronLeft className="h-4 w-4" />
            Back to MBRs
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Master Batch Record</h1>
        <p className="mt-1 text-sm text-gray-500">
          Define your manufacturing recipe step by step.
        </p>
      </div>

      <MBRBuilderWizard />
    </div>
  )
}
