"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle } from "lucide-react"

interface Props {
  mbrId: string
}

export function MBRApproveButton({ mbrId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/approve`, { method: "POST" })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.message ?? "Failed to approve MBR")
        return
      }

      toast.success("MBR approved successfully")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleApprove} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
      Approve MBR
    </Button>
  )
}
