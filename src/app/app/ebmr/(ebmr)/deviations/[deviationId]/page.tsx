"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  FlaskConical,
  Loader2,
  Search,
  Sparkles,
  User,
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"
import {
  DEVIATION_SEVERITY_COLORS,
  DEVIATION_SEVERITY_LABELS,
} from "@/shared/constants/pharma.constants"

// ============================================
// TYPES
// ============================================

interface AIRootCause {
  cause: string
  likelihood: "high" | "medium" | "low"
  rationale: string
}

interface AISuggestion {
  rootCauses: AIRootCause[]
  investigationQuestions: string[]
  capaTemplates: Array<{ corrective: string; preventive: string }>
  similarPatterns: string
  riskNote: string
}

interface DeviationDetail {
  id: string
  deviationNumber: string
  deviationType: string
  category: string
  severity: string
  description: string
  rootCause: string | null
  impactAssessment: string | null
  correctiveAction: string | null
  preventiveAction: string | null
  status: string
  raisedAt: string
  resolvedAt: string | null
  batch: {
    id: string
    batchNumber: string
  }
  batchStep?: {
    stepName: string
    stepNumber: number
  } | null
  raisedBy: {
    fullName: string
    employeeId: string | null
  }
  resolvedBy?: {
    fullName: string
    employeeId: string | null
  } | null
  approvedBy?: {
    fullName: string
    employeeId: string | null
  } | null
}

// ============================================
// CONSTANTS
// ============================================

const DEVIATION_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  under_investigation: "bg-purple-100 text-purple-700",
  resolved: "bg-teal-100 text-teal-700",
  closed: "bg-green-100 text-green-700",
}

const DEVIATION_STATUS_LABELS: Record<string, string> = {
  open: "Open",
  under_investigation: "Under Investigation",
  resolved: "Resolved",
  closed: "Closed",
}

const DEVIATION_TYPE_LABELS: Record<string, string> = {
  planned: "Planned",
  unplanned: "Unplanned",
}

const DEVIATION_CATEGORY_LABELS: Record<string, string> = {
  process: "Process",
  equipment: "Equipment",
  material: "Material",
  environmental: "Environmental",
}

// ============================================
// DATA FETCHING
// ============================================

async function fetchDeviation(id: string): Promise<DeviationDetail> {
  const res = await fetch(`/api/deviations/${id}`)
  if (!res.ok) throw new Error("Failed to fetch deviation")
  const json = await res.json()
  return json.data
}

async function updateDeviationApi(
  id: string,
  data: Partial<{
    rootCause: string
    impactAssessment: string
    correctiveAction: string
    preventiveAction: string
    status: string
  }>
): Promise<DeviationDetail> {
  const res = await fetch(`/api/deviations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? "Failed to update deviation")
  }
  const json = await res.json()
  return json.data
}

async function closeDeviationApi(id: string): Promise<DeviationDetail> {
  const res = await fetch(`/api/deviations/${id}/close`, {
    method: "POST",
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message ?? "Failed to close deviation")
  }
  const json = await res.json()
  return json.data
}

// ============================================
// PAGE COMPONENT
// ============================================

export default function DeviationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const deviationId = params.deviationId as string

  const [rootCause, setRootCause] = useState("")
  const [impactAssessment, setImpactAssessment] = useState("")
  const [correctiveAction, setCorrectiveAction] = useState("")
  const [preventiveAction, setPreventiveAction] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExpanded, setAiExpanded] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportContent, setReportContent] = useState<string | null>(null)
  const [reportCopied, setReportCopied] = useState(false)

  const { data: deviation, isLoading } = useQuery<DeviationDetail>({
    queryKey: ["deviation", deviationId],
    queryFn: () => fetchDeviation(deviationId),
  })

  // Sync form state when data loads
  useEffect(() => {
    if (deviation) {
      setRootCause(deviation.rootCause ?? "")
      setImpactAssessment(deviation.impactAssessment ?? "")
      setCorrectiveAction(deviation.correctiveAction ?? "")
      setPreventiveAction(deviation.preventiveAction ?? "")
    }
  }, [deviation])

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateDeviationApi>[1]) =>
      updateDeviationApi(deviationId, data),
    onSuccess: () => {
      toast.success("Deviation updated successfully")
      queryClient.invalidateQueries({ queryKey: ["deviation", deviationId] })
      queryClient.invalidateQueries({ queryKey: ["deviations"] })
      setIsEditing(false)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const markUnderInvestigationMutation = useMutation({
    mutationFn: () => updateDeviationApi(deviationId, { status: "under_investigation" }),
    onSuccess: () => {
      toast.success("Deviation marked as under investigation")
      queryClient.invalidateQueries({ queryKey: ["deviation", deviationId] })
      queryClient.invalidateQueries({ queryKey: ["deviations"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => closeDeviationApi(deviationId),
    onSuccess: () => {
      toast.success("Deviation closed successfully")
      queryClient.invalidateQueries({ queryKey: ["deviation", deviationId] })
      queryClient.invalidateQueries({ queryKey: ["deviations"] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleAISuggest = async () => {
    setAiLoading(true)
    setAiSuggestion(null)
    try {
      const res = await fetch(`/api/deviations/${deviationId}/ai-suggest`, { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.message ?? "AI request failed")
      setAiSuggestion(json.data.suggestion)
      setAiExpanded(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "AI suggestion failed")
    } finally {
      setAiLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    setReportLoading(true)
    try {
      const res = await fetch(`/api/deviations/${deviationId}/generate-report`, { method: "POST" })
      const json = await res.json()
      if (!json.success) throw new Error(json.message ?? "Report generation failed")
      setReportContent(json.data.report)
      toast.success("Investigation report generated")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to generate report")
    } finally {
      setReportLoading(false)
    }
  }

  const handleCopyReport = () => {
    if (!reportContent) return
    navigator.clipboard.writeText(reportContent)
    setReportCopied(true)
    setTimeout(() => setReportCopied(false), 2000)
  }

  const applyAISuggestion = (capa: { corrective: string; preventive: string }) => {
    if (!isEditing) setIsEditing(true)
    setCorrectiveAction(capa.corrective)
    setPreventiveAction(capa.preventive)
    toast.success("CAPA template applied — review and edit as needed")
  }

  const handleSaveInvestigation = () => {
    updateMutation.mutate({
      rootCause: rootCause || undefined,
      impactAssessment: impactAssessment || undefined,
      correctiveAction: correctiveAction || undefined,
      preventiveAction: preventiveAction || undefined,
    })
  }

  const isEditable =
    deviation?.status === "open" || deviation?.status === "under_investigation"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!deviation) {
    return (
      <div className="flex flex-col items-center gap-3 py-24">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">Deviation not found</p>
        <Button variant="outline" size="sm" onClick={() => router.push(ROUTES.DEVIATIONS)}>
          Back to Deviations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gray-500 hover:text-gray-800"
          onClick={() => router.push(ROUTES.DEVIATIONS)}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Deviations
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold font-mono text-gray-900">
            {deviation.deviationNumber}
          </h1>
          <Badge
            variant="outline"
            className={`text-xs border-transparent ${
              DEVIATION_SEVERITY_COLORS[
                deviation.severity as keyof typeof DEVIATION_SEVERITY_COLORS
              ] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {DEVIATION_SEVERITY_LABELS[
              deviation.severity as keyof typeof DEVIATION_SEVERITY_LABELS
            ] ?? deviation.severity}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs border-transparent ${
              DEVIATION_STATUS_COLORS[deviation.status] ?? "bg-gray-100 text-gray-600"
            }`}
          >
            {DEVIATION_STATUS_LABELS[deviation.status] ?? deviation.status}
          </Badge>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center gap-2">
          {/* AI Suggest button — visible when editable */}
          {isEditable && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
              onClick={handleAISuggest}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              AI Suggest RCA
            </Button>
          )}
          {/* Generate Report button — available on closed/resolved deviations too */}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={handleGenerateReport}
            disabled={reportLoading}
          >
            {reportLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="h-3.5 w-3.5" />
            )}
            Generate Report
          </Button>
          {deviation.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
              onClick={() => markUnderInvestigationMutation.mutate()}
              disabled={markUnderInvestigationMutation.isPending}
            >
              {markUnderInvestigationMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              Mark Under Investigation
            </Button>
          )}
          {(deviation.status === "open" || deviation.status === "under_investigation") && (
            <Button
              size="sm"
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => closeMutation.mutate()}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" />
              )}
              Close Deviation
            </Button>
          )}
        </div>
      </div>

      {/* Info Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Batch */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-blue-50 p-2">
                <FlaskConical className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Batch</p>
                <Link
                  href={ROUTES.BATCH_DETAIL(deviation.batch.id)}
                  className="text-sm font-semibold font-mono text-blue-600 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deviation.batch.batchNumber}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-gray-50 p-2">
                <Clock className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Step</p>
                <p className="text-sm font-medium text-gray-800">
                  {deviation.batchStep
                    ? `Step ${deviation.batchStep.stepNumber}: ${deviation.batchStep.stepName}`
                    : <span className="text-gray-400">—</span>}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Type & Category */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-orange-50 p-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Type / Category</p>
                <p className="text-sm font-medium text-gray-800">
                  {DEVIATION_TYPE_LABELS[deviation.deviationType] ?? deviation.deviationType}
                  {" / "}
                  {DEVIATION_CATEGORY_LABELS[deviation.category] ?? deviation.category}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raised By */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-gray-50 p-2">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Raised By</p>
                <p className="text-sm font-medium text-gray-800">
                  {deviation.raisedBy.fullName}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(deviation.raisedAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {deviation.description}
          </p>
        </CardContent>
      </Card>

      {/* AI Suggestion Panel */}
      {aiSuggestion && (
        <Card className="border border-gray-300 shadow-sm bg-gray-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-sm font-semibold text-gray-800">
                  AI Root Cause Analysis
                </CardTitle>
                <span className="text-[10px] font-medium text-gray-500 border border-gray-300 rounded-full px-2 py-0.5">
                  Review before applying
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setAiExpanded((v) => !v)}
              >
                {aiExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>
            {aiSuggestion.riskNote && (
              <p className="text-xs text-gray-600 mt-1 pl-6">{aiSuggestion.riskNote}</p>
            )}
          </CardHeader>
          {aiExpanded && (
            <CardContent className="space-y-5">
              {/* Root Causes */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Probable Root Causes</p>
                <div className="space-y-2">
                  {aiSuggestion.rootCauses.map((rc, i) => (
                    <div key={i} className="flex gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          rc.likelihood === "high"
                            ? "bg-gray-800 text-white"
                            : rc.likelihood === "medium"
                            ? "bg-gray-300 text-gray-800"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {rc.likelihood}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800">{rc.cause}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{rc.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Investigation Questions */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Investigation Questions
                </p>
                <ul className="space-y-1">
                  {aiSuggestion.investigationQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-gray-400 shrink-0">{i + 1}.</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              {aiSuggestion.similarPatterns &&
                aiSuggestion.similarPatterns !== "No patterns detected" && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        Historical Patterns
                      </p>
                      <p className="text-sm text-gray-600">{aiSuggestion.similarPatterns}</p>
                    </div>
                  </>
                )}

              <Separator />

              {/* CAPA Templates */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Suggested CAPA Templates{" "}
                  <span className="font-normal text-gray-400">(click to apply)</span>
                </p>
                <div className="space-y-2">
                  {aiSuggestion.capaTemplates.map((capa, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg p-3 bg-white hover:border-gray-400 cursor-pointer transition-colors"
                      onClick={() => applyAISuggestion(capa)}
                    >
                      <p className="text-xs font-medium text-gray-600 mb-0.5">Corrective</p>
                      <p className="text-sm text-gray-800 mb-2">{capa.corrective}</p>
                      <p className="text-xs font-medium text-gray-600 mb-0.5">Preventive</p>
                      <p className="text-sm text-gray-800">{capa.preventive}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Investigation Section */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-800">
              Investigation &amp; Corrective Actions
            </CardTitle>
            {isEditable && !isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Root Cause */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Root Cause</Label>
            {isEditing ? (
              <Textarea
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Describe the root cause of the deviation..."
                rows={3}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[40px]">
                {deviation.rootCause || <span className="text-gray-400 italic">Not yet documented</span>}
              </p>
            )}
          </div>

          <Separator />

          {/* Impact Assessment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Impact Assessment</Label>
            {isEditing ? (
              <Textarea
                value={impactAssessment}
                onChange={(e) => setImpactAssessment(e.target.value)}
                placeholder="Describe the impact of this deviation on product quality..."
                rows={3}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[40px]">
                {deviation.impactAssessment || (
                  <span className="text-gray-400 italic">Not yet documented</span>
                )}
              </p>
            )}
          </div>

          <Separator />

          {/* Corrective Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Corrective Action (CAPA)</Label>
            {isEditing ? (
              <Textarea
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="Describe the corrective action taken..."
                rows={3}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[40px]">
                {deviation.correctiveAction || (
                  <span className="text-gray-400 italic">Not yet documented</span>
                )}
              </p>
            )}
          </div>

          <Separator />

          {/* Preventive Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">Preventive Action</Label>
            {isEditing ? (
              <Textarea
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
                placeholder="Describe the preventive action to avoid recurrence..."
                rows={3}
                className="text-sm resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap min-h-[40px]">
                {deviation.preventiveAction || (
                  <span className="text-gray-400 italic">Not yet documented</span>
                )}
              </p>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRootCause(deviation.rootCause ?? "")
                  setImpactAssessment(deviation.impactAssessment ?? "")
                  setCorrectiveAction(deviation.correctiveAction ?? "")
                  setPreventiveAction(deviation.preventiveAction ?? "")
                  setIsEditing(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveInvestigation}
                disabled={updateMutation.isPending}
                className="gap-1.5"
              >
                {updateMutation.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI-Generated Investigation Report */}
      {reportContent && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-700" />
                <CardTitle className="text-sm font-semibold text-gray-800">
                  AI-Generated Investigation Report
                </CardTitle>
                <span className="text-[10px] font-medium text-gray-500 border border-gray-300 rounded-full px-2 py-0.5">
                  Human review required before filing
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  onClick={handleCopyReport}
                >
                  <Copy className="h-3 w-3" />
                  {reportCopied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-7 text-xs"
                  onClick={handleGenerateReport}
                  disabled={reportLoading}
                >
                  {reportLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Regenerate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-5">
              <pre className="whitespace-pre-wrap text-xs text-gray-800 font-mono leading-relaxed">
                {reportContent}
              </pre>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              This report is AI-generated. Review, edit as needed, then obtain QA approval and e-signature before archiving. Compliant with FDA 21 CFR 211.192 and ICH Q10 documentation requirements.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Resolution Info */}
      {deviation.resolvedBy && (
        <Card className="border border-green-200 bg-green-50/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Closed by {deviation.resolvedBy.fullName}
                </p>
                {deviation.resolvedAt && (
                  <p className="text-xs text-green-600">
                    {new Date(deviation.resolvedAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
