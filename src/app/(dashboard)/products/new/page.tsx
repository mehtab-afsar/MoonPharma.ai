"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductForm } from "@/features/products/components/ProductForm"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-gray-500 hover:text-gray-900">
          <Link href="/products">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New Product</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register a new pharmaceutical product in your catalogue.
        </p>
      </div>

      <ProductForm />
    </div>
  )
}
