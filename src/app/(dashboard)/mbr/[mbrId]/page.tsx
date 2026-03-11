import { redirect } from "next/navigation"
export default async function LegacyRedirect({ params }: { params: Promise<{ mbrId: string }> }) {
  const { mbrId } = await params
  redirect(`/app/ebmr/mbr/${mbrId}`)
}
