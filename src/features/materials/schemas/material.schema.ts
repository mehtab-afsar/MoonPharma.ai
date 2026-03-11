import { z } from "zod"
import { MaterialType, PharmacoepialGrade } from "@/generated/prisma"

export const materialSchema = z.object({
  materialCode: z.string().min(1, "Material code is required"),
  materialName: z.string().min(2, "Material name must be at least 2 characters"),
  materialType: z.nativeEnum(MaterialType),
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  pharmacoepialGrade: z.nativeEnum(PharmacoepialGrade).optional(),
})

export type MaterialFormValues = z.infer<typeof materialSchema>
