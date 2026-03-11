// Shared OpenRouter API client for all AI features in MoonPharma eBMR
// OpenRouter provides OpenAI-compatible API supporting Claude models
// All interactions are logged to AIInteraction table for FDA audit compliance

const OPENROUTER_BASE = "https://openrouter.ai/api/v1"

export const MODELS = {
  /** Fast, for quick suggestions and chat */
  FAST: "anthropic/claude-sonnet-4-5",
  /** High quality, for batch review and report generation */
  SMART: "anthropic/claude-opus-4-5",
} as const

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface OpenRouterResponse {
  content: string
  tokensUsed: number
  modelUsed: string
}

/**
 * Call OpenRouter with the given messages and return the assistant reply.
 * Uses `fetch` — no extra SDK dependency required.
 */
export async function callOpenRouter(
  messages: ChatMessage[],
  options: {
    model?: string
    maxTokens?: number
    responseFormat?: "text" | "json"
  } = {}
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured")

  const model = options.model ?? MODELS.FAST
  const maxTokens = options.maxTokens ?? 2048

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages,
  }

  if (options.responseFormat === "json") {
    body.response_format = { type: "json_object" }
  }

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://moonpharma.com",
      "X-Title": "MoonPharma eBMR",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter API error ${res.status}: ${errText}`)
  }

  const json = await res.json()
  const choice = json.choices?.[0]
  if (!choice) throw new Error("No response from OpenRouter")

  return {
    content: choice.message.content ?? "",
    tokensUsed: json.usage?.total_tokens ?? 0,
    modelUsed: json.model ?? model,
  }
}
