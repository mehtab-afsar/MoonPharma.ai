import { redirect } from "next/navigation"

// Root "/" is now the public landing page.
// Authenticated users who somehow land here get redirected to /dashboard.
export default function RootDashboardRedirect() {
  redirect("/dashboard")
}
