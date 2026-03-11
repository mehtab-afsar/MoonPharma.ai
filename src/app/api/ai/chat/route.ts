import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { unauthorizedResponse, errorResponse } from "@/server/utils/api-response"
import { runChatAgent } from "@/server/ai/chat-agent"
import { prisma } from "@/server/db/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const messages = body.messages as { role: "user" | "assistant"; content: string }[]

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse("Messages array is required", 400)
    }

    const content = await runChatAgent(messages)

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")

    // Log to AIInteraction for compliance (non-blocking)
    prisma.aIInteraction
      .create({
        data: {
          orgId: session.user.orgId,
          userId: session.user.id,
          interactionType: "chat",
          prompt: (lastUserMessage?.content ?? "").slice(0, 500),
          response: content.slice(0, 1000),
          modelUsed: "anthropic/claude-sonnet-4-5",
        },
      })
      .catch(() => {})

    return Response.json({ success: true, content })
  } catch (error) {
    console.error("[POST /api/ai/chat]", error)
    return errorResponse(
      error instanceof Error ? error.message : "AI request failed",
      500
    )
  }
}
