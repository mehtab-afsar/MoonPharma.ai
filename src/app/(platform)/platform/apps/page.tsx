import Link from "next/link"
import { FlaskConical, ArrowRight } from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

export default function PlatformAppsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Launch and manage apps connected to your MoonPharma platform.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* eBMR Card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 hover:border-gray-900 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center shrink-0">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">eBMR</p>
              <p className="text-xs text-gray-500">Electronic Batch Manufacturing Records</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 flex-1">
            Manage master batch records, execute manufacturing batches, track deviations, and perform QA reviews.
          </p>
          <Link
            href={ROUTES.DASHBOARD}
            className="flex items-center justify-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Open eBMR
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Placeholder */}
        <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 flex flex-col gap-4 opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
              <span className="text-gray-400 text-lg">+</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">More apps coming soon</p>
              <p className="text-xs text-gray-400">Stay tuned</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 flex-1">
            Additional modules and integrations will be available here in future updates.
          </p>
        </div>
      </div>
    </div>
  )
}
