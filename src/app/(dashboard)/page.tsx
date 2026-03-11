import { redirect } from "next/navigation"

// Legacy redirect: /dashboard → /app/ebmr/dashboard
export default function LegacyDashboardRedirect() {
  redirect("/app/ebmr/dashboard")
}
