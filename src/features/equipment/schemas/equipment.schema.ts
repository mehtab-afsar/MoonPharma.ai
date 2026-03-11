import { z } from "zod"

export const equipmentSchema = z.object({
  equipmentCode: z.string().min(1, "Equipment code is required"),
  equipmentName: z.string().min(2, "Equipment name must be at least 2 characters"),
  equipmentType: z.string().min(1, "Equipment type is required"),
  location: z.string().optional(),
  capacity: z.string().optional(),
  lastCalibrationDate: z.string().optional(),
  nextCalibrationDate: z.string().optional(),
})

export type EquipmentFormValues = z.infer<typeof equipmentSchema>
