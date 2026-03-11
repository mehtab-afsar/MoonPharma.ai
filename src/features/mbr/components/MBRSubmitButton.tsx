"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Loader2, Send } from "lucide-react"

interface Props {
  mbrId: string
}

export function MBRSubmitButton({ mbrId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    try {
      const res = await fetch(`/api/mbr/${mbrId}/submit`, { method: "POST" })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.message ?? "Failed to submit MBR for review")
        return
      }

      toast.success("MBR submitted for review")
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSubmit} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      Submit for Review
    </Button>
  )
}
