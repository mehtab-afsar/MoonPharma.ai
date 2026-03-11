import { z } from "zod"
import { DosageForm } from "@/generated/prisma"

export const productSchema = z.object({
  productCode: z.string().min(1, "Product code is required"),
  productName: z.string().min(2, "Product name must be at least 2 characters"),
  genericName: z.string().optional(),
  dosageForm: z.nativeEnum(DosageForm),
  strength: z.string().min(1, "Strength is required"),
  shelfLifeMonths: z
    .number()
    .int()
    .positive()
    .optional(),
  storageConditions: z.string().optional(),
  regulatoryCategory: z.string().optional(),
})

export type ProductFormValues = z.infer<typeof productSchema>
