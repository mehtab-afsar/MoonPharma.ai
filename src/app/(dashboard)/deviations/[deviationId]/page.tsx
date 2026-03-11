import { redirect } from "next/navigation"
export default async function LegacyRedirect({ params }: { params: Promise<{ deviationId: string }> }) {
  const { deviationId } = await params
  redirect(`/app/ebmr/deviations/${deviationId}`)
}
