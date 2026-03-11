import { redirect } from "next/navigation"
export default async function LegacyRedirect({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params
  redirect(`/app/ebmr/batches/${batchId}`)
}
