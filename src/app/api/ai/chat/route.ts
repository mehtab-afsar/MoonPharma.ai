import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { unauthorizedResponse, errorResponse } from "@/server/utils/api-response"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are MoonPharma eBMR Assistant — an expert in pharmaceutical batch manufacturing, GMP compliance, FDA 21 CFR Part 11, ALCOA+ data integrity, ICH guidelines, and electronic batch record systems.

You help pharmaceutical manufacturing teams with:
- Batch Manufacturing Record (BMR/MBR) questions and compliance
- Deviation investigation guidance and CAPA suggestions
- GMP and regulatory compliance (FDA, WHO, ICH, Schedule M)
- Equipment qualification (IQ/OQ/PQ) and calibration
- In-process control (IPC) interpretation and yield calculations
- Material handling, dispensing tolerances, and specifications
- QA review workflows and batch release decisions
- 21 CFR Part 11 electronic signature requirements

Guidelines:
- Always be precise, regulatory-aware, and cite standards where relevant
- For deviation analysis, suggest root causes systematically (5-Why, Ishikawa)
- For out-of-spec results, suggest OOS investigation steps per FDA guidance
- Keep responses concise and actionable for manufacturing floor context
- Never make up specific regulatory text — acknowledge uncertainty when needed`

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const { messages } = body as { messages: { role: "user" | "assistant"; content: string }[] }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("Messages array is required", 400)
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")

    return Response.json({ success: true, content: text })
  } catch (error) {
    console.error("[POST /api/ai/chat]", error)
    return errorResponse(
      error instanceof Error ? error.message : "AI request failed",
      500
    )
  }
}
