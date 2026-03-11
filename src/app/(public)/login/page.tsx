import { LoginForm } from "@/features/auth/components/LoginForm"
import { FlaskConical } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-black mb-4">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">MoonPharma eBMR</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-black hover:underline">
            Register
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400">
          21 CFR Part 11 Compliant · ALCOA+ · GMP Ready
        </p>
      </div>
    </div>
  )
}
