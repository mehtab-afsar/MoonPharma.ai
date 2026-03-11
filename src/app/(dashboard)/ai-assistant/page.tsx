"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import { Bot, Send, User, Loader2, RotateCcw, Sparkles, FlaskConical, AlertTriangle, FileText, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// ============================================
// TYPES
// ============================================

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  ts: Date
}

// ============================================
// SUGGESTED PROMPTS
// ============================================

const SUGGESTIONS = [
  {
    icon: AlertTriangle,
    label: "Deviation Investigation",
    prompt: "Guide me through a systematic deviation investigation for an out-of-spec tablet hardness result.",
  },
  {
    icon: FlaskConical,
    label: "Yield Calculation",
    prompt: "How do I calculate theoretical yield, actual yield, and percentage yield for a batch record? What are acceptable limits?",
  },
  {
    icon: FileText,
    label: "MBR Best Practices",
    prompt: "What are the GMP requirements for a Master Batch Record? What sections must it contain per Schedule M?",
  },
  {
    icon: ShieldCheck,
    label: "21 CFR Part 11",
    prompt: "Explain the key requirements of 21 CFR Part 11 for electronic batch records and what our eBMR system must comply with.",
  },
]

// ============================================
// HELPERS
// ============================================

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 rounded px-1 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\n\n/g, "</p><p class='mt-3'>")
    .replace(/\n- /g, "</p><li class='ml-4 list-disc mt-1'>")
    .replace(/\n(\d+)\. /g, "</p><li class='ml-4 list-decimal mt-1'>")
    .replace(/\n/g, "<br/>")
}

// ============================================
// MESSAGE BUBBLE
// ============================================

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user"

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
          isUser ? "bg-black" : "bg-gray-100 border border-gray-200"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-gray-600" />
        )}
      </div>

      {/* Bubble */}
      <div className={cn("max-w-[78%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-black text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div
              className="prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: "<p>" + parseMarkdown(msg.content) + "</p>" }}
            />
          )}
        </div>
        <p className={cn("text-[10px] text-gray-400 px-1", isUser ? "text-right" : "text-left")}>
          {formatTime(msg.ts)}
        </p>
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE
// ============================================

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      ts: new Date(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()

      if (!data.success) throw new Error(data.message ?? "AI request failed")

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        ts: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please check your API key configuration or try again.",
        ts: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleReset = () => {
    setMessages([])
    setInput("")
    textareaRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              AI Assistant
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-gray-500 border border-gray-200 bg-gray-50 rounded-full px-2 py-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Claude-powered
              </span>
            </h1>
            <p className="text-sm text-gray-500">GMP, batch records, deviations, regulatory guidance</p>
          </div>
        </div>
        {!isEmpty && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            New Chat
          </Button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 bg-gray-50/50 min-h-0">
        {isEmpty ? (
          /* Empty state */
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">MoonPharma eBMR Assistant</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-8 leading-relaxed">
              Ask me anything about GMP compliance, batch records, deviations, regulatory requirements, or manufacturing best practices.
            </p>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.prompt)}
                  className="flex items-start gap-3 text-left p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all duration-150 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-colors">
                    <s.icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{s.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{s.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="p-5 space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="mt-3 flex-shrink-0">
        <div className="flex gap-2 items-end rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-gray-400 transition-colors">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about GMP, batch records, deviations, yield calculations… (Enter to send)"
            className="flex-1 min-h-[44px] max-h-[140px] border-0 bg-transparent shadow-none resize-none focus-visible:ring-0 text-sm p-1.5 leading-relaxed"
            rows={1}
            disabled={loading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || loading}
            className="h-9 w-9 p-0 flex-shrink-0 bg-black text-white hover:bg-gray-800 rounded-xl"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Shift+Enter for new line · Powered by Claude
        </p>
      </form>
    </div>
  )
}
