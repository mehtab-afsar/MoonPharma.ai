"use client"

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, ChevronLeft, ChevronRight, ArrowRight, Filter } from "lucide-react"

// ============================================
// TYPES
// ============================================

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "SIGN"
  | "LOGIN"
  | "LOGOUT"
  | "VIEW"
  | "EXPORT"

interface AuditTrailItem {
  id: string
  orgId: string | null
  userId: string | null
  userName: string | null
  userRole: string | null
  action: AuditAction
  tableName: string
  recordId: string
  fieldName: string | null
  oldValue: string | null
  newValue: string | null
  reasonForChange: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  user: {
    fullName: string
    employeeId: string
    role: string
  } | null
}

interface PaginatedResponse {
  success: boolean
  data: AuditTrailItem[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// ============================================
// CONSTANTS
// ============================================

const TABLE_OPTIONS = [
  { value: "all", label: "All Tables" },
  { value: "batches", label: "Batches" },
  { value: "batch_materials", label: "Batch Materials" },
  { value: "batch_steps", label: "Batch Steps" },
  { value: "master_batch_records", label: "Master Batch Records" },
  { value: "products", label: "Products" },
  { value: "materials", label: "Materials" },
  { value: "deviations", label: "Deviations" },
  { value: "batch_reviews", label: "Batch Reviews" },
  { value: "users", label: "Users" },
]

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Actions" },
  { value: "CREATE", label: "CREATE" },
  { value: "UPDATE", label: "UPDATE" },
  { value: "DELETE", label: "DELETE" },
  { value: "SIGN", label: "SIGN" },
  { value: "LOGIN", label: "LOGIN" },
  { value: "LOGOUT", label: "LOGOUT" },
  { value: "VIEW", label: "VIEW" },
  { value: "EXPORT", label: "EXPORT" },
]

const ACTION_BADGE_STYLES: Record<AuditAction, string> = {
  CREATE: "bg-green-100 text-green-800 border-green-200",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-200",
  DELETE: "bg-red-100 text-red-800 border-red-200",
  SIGN: "bg-purple-100 text-purple-800 border-purple-200",
  LOGIN: "bg-gray-100 text-gray-700 border-gray-200",
  LOGOUT: "bg-gray-100 text-gray-700 border-gray-200",
  VIEW: "bg-slate-100 text-slate-700 border-slate-200",
  EXPORT: "bg-orange-100 text-orange-800 border-orange-200",
}

// ============================================
// HELPERS
// ============================================

function truncate(str: string | null, maxLen = 20): string {
  if (!str) return "—"
  return str.length > maxLen ? str.slice(0, maxLen) + "…" : str
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AuditTrailPage() {
  // Filter state
  const [tableName, setTableName] = useState("all")
  const [action, setAction] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Applied filter state (only updates when "Apply Filters" is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    tableName: "all",
    action: "all",
    startDate: "",
    endDate: "",
  })

  // Pagination
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 50

  // Data state
  const [items, setItems] = useState<AuditTrailItem[]>([])
  const [pagination, setPagination] = useState<PaginatedResponse["pagination"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchData = useCallback(
    async (filters: typeof appliedFilters, currentPage: number) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (filters.tableName !== "all") params.set("tableName", filters.tableName)
        if (filters.action !== "all") params.set("action", filters.action)
        if (filters.startDate) params.set("startDate", filters.startDate)
        if (filters.endDate) params.set("endDate", filters.endDate)
        params.set("page", String(currentPage))
        params.set("limit", String(PAGE_SIZE))

        const res = await fetch(`/api/audit-trail?${params.toString()}`)
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.message ?? `Request failed with status ${res.status}`)
        }
        const body: PaginatedResponse = await res.json()
        setItems(body.data)
        setPagination(body.pagination)
        setHasFetched(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load audit trail")
      } finally {
        setLoading(false)
      }
    },
    []
  )

  function handleApplyFilters() {
    const filters = { tableName, action, startDate, endDate }
    setAppliedFilters(filters)
    setPage(1)
    fetchData(filters, 1)
  }

  function handlePageChange(newPage: number) {
    setPage(newPage)
    fetchData(appliedFilters, newPage)
  }

  function handleClearFilters() {
    const empty = { tableName: "all", action: "all", startDate: "", endDate: "" }
    setTableName("all")
    setAction("all")
    setStartDate("")
    setEndDate("")
    setAppliedFilters(empty)
    setPage(1)
    fetchData(empty, 1)
  }

  const start = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const end = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : 0

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-100 p-2">
            <History className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Immutable record of all system actions — 21 CFR Part 11 compliant
            </p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Narrow results by table, action, or date range, then click Apply Filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Table Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Table</label>
              <Select value={tableName} onValueChange={setTableName}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Action</label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2">
              <Button
                onClick={handleApplyFilters}
                disabled={loading}
                className="h-9 flex-1 text-sm"
              >
                {loading ? "Loading…" : "Apply Filters"}
              </Button>
              {hasFetched && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={loading}
                  className="h-9 text-sm"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Audit Records
              </CardTitle>
              {pagination && (
                <CardDescription className="mt-0.5 text-sm text-gray-500">
                  Showing {start}–{end} of {pagination.total.toLocaleString()} records
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="mx-6 my-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {!hasFetched && !loading && !error && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <History className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">
                Select filters and click Apply Filters to view audit records.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="ml-3 text-sm text-gray-500">Loading audit records…</span>
            </div>
          )}

          {hasFetched && !loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <History className="h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-500">No records found</p>
              <p className="text-xs text-gray-400">Try adjusting your filter criteria.</p>
            </div>
          )}

          {hasFetched && !loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-100 bg-gray-50">
                    <TableHead className="w-[90px] text-xs font-medium text-gray-500">
                      ID
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">User</TableHead>
                    <TableHead className="w-[100px] text-xs font-medium text-gray-500">
                      Action
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Table</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Record ID</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Field</TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">
                      Old Value → New Value
                    </TableHead>
                    <TableHead className="text-xs font-medium text-gray-500">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className="border-gray-100 hover:bg-gray-50">
                      {/* ID */}
                      <TableCell className="py-2">
                        <span className="font-mono text-xs text-gray-500">
                          #{truncate(item.id, 12)}
                        </span>
                      </TableCell>

                      {/* User */}
                      <TableCell className="py-2">
                        {item.user ? (
                          <div>
                            <p className="text-xs font-medium text-gray-900">
                              {item.user.fullName}
                            </p>
                            <p className="text-xs text-gray-400">{item.user.employeeId}</p>
                          </div>
                        ) : item.userName ? (
                          <p className="text-xs text-gray-700">{item.userName}</p>
                        ) : (
                          <span className="text-xs text-gray-400">System</span>
                        )}
                      </TableCell>

                      {/* Action Badge */}
                      <TableCell className="py-2">
                        <span
                          className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${
                            ACTION_BADGE_STYLES[item.action] ??
                            "border-gray-200 bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.action}
                        </span>
                      </TableCell>

                      {/* Table */}
                      <TableCell className="py-2">
                        <span className="font-mono text-xs text-gray-700">{item.tableName}</span>
                      </TableCell>

                      {/* Record ID */}
                      <TableCell className="py-2">
                        <span
                          className="font-mono text-xs text-gray-500"
                          title={item.recordId}
                        >
                          {truncate(item.recordId, 18)}
                        </span>
                      </TableCell>

                      {/* Field */}
                      <TableCell className="py-2">
                        {item.fieldName ? (
                          <span className="font-mono text-xs text-gray-600">
                            {item.fieldName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Old → New Value */}
                      <TableCell className="py-2">
                        {item.oldValue || item.newValue ? (
                          <div className="flex items-center gap-1">
                            {item.oldValue && (
                              <span
                                className="max-w-[80px] truncate font-mono text-xs text-gray-400 line-through"
                                title={item.oldValue}
                              >
                                {truncate(item.oldValue, 16)}
                              </span>
                            )}
                            {item.oldValue && item.newValue && (
                              <ArrowRight className="h-3 w-3 flex-shrink-0 text-gray-400" />
                            )}
                            {item.newValue && (
                              <span
                                className="max-w-[80px] truncate font-mono text-xs text-gray-700"
                                title={item.newValue}
                              >
                                {truncate(item.newValue, 16)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </TableCell>

                      {/* Timestamp */}
                      <TableCell className="py-2">
                        <span className="whitespace-nowrap text-xs text-gray-500">
                          {formatTimestamp(item.createdAt)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
              <p className="text-sm text-gray-500">
                Showing {start}–{end} of {pagination.total.toLocaleString()} records
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1 || loading}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= pagination.totalPages || loading}
                  className="h-8 gap-1 text-xs"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
