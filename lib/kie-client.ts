import type { StreamChunk } from "@/types"

// ─── Endpoint routing ────────────────────────────────────────────────

function getEndpointUrl(model: string): string {
  if (model === "deepseek-chat" || model === "deepseek-reasoner") {
    return "https://kieai.erweima.ai/api/v1/chat/completions"
  }
  if (model.startsWith("claude-")) {
    return `https://api.kie.ai/claude/v1/messages`
  }
  // Gemini, GPT, etc.
  return `https://api.kie.ai/${model}/v1/chat/completions`
}

function isClaudeModel(model: string): boolean {
  return model.startsWith("claude-")
}

// ─── Claude (Anthropic Messages API) streaming ──────────────────────

async function* streamClaude(
  apiKey: string,
  model: string,
  messagesPayload: { role: string; content: string }[],
  systemPrompt?: string | null
): AsyncGenerator<StreamChunk> {
  // Anthropic format: system is a top-level field, not in messages
  const filteredMessages = messagesPayload.filter((m) => m.role !== "system")

  // Build system from explicit param or from system messages in array
  const systemMessages = messagesPayload
    .filter((m) => m.role === "system")
    .map((m) => m.content)
  const finalSystem = systemPrompt || systemMessages.join("\n") || undefined

  const body: Record<string, unknown> = {
    model,
    messages: filteredMessages,
    max_tokens: 8192,
    stream: true,
  }
  if (finalSystem) {
    body.system = finalSystem
  }

  const response = await fetch(getEndpointUrl(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    yield { error: `Claude API error ${response.status}: ${errorText}`, done: true }
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { error: "No response body", done: true }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        const data = line.slice(6).trim()
        if (!data) continue

        try {
          const event = JSON.parse(data)

          if (event.type === "content_block_delta" && event.delta?.text) {
            yield { token: event.delta.text }
          } else if (event.type === "message_delta" && event.usage) {
            yield {
              usage: {
                inputTokens: event.usage.input_tokens,
                outputTokens: event.usage.output_tokens,
              },
            }
          } else if (event.type === "message_stop") {
            yield { done: true }
            return
          } else if (event.type === "error") {
            yield {
              error: event.error?.message ?? "Unknown Claude error",
              done: true,
            }
            return
          }
        } catch {
          // Skip non-JSON lines (e.g. "event:" lines)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { done: true }
}

// ─── OpenAI-compatible streaming ────────────────────────────────────

async function* streamOpenAICompatible(
  apiKey: string,
  model: string,
  messagesPayload: { role: string; content: string }[]
): AsyncGenerator<StreamChunk> {
  const response = await fetch(getEndpointUrl(model), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messagesPayload,
      stream: true,
      stream_options: { include_usage: true },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    // KIE.AI sometimes returns non-SSE JSON error bodies
    try {
      const errJson = JSON.parse(errorText)
      if (errJson.code && errJson.code !== 200) {
        yield {
          error: errJson.message ?? `API error code ${errJson.code}`,
          done: true,
        }
        return
      }
    } catch {
      // Not JSON, use raw text
    }
    yield { error: `API error ${response.status}: ${errorText}`, done: true }
    return
  }

  // Check for non-streaming JSON error response (KIE.AI quirk)
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const json = await response.json()
    if (json.code && json.code !== 200) {
      yield { error: json.message ?? "API error", done: true }
      return
    }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    yield { error: "No response body", done: true }
    return
  }

  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const data = trimmed.slice(5).trim()

        if (data === "[DONE]") {
          yield { done: true }
          return
        }

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta
          if (delta?.content) {
            yield { token: delta.content }
          }
          if (parsed.usage) {
            yield {
              usage: {
                inputTokens: parsed.usage.prompt_tokens,
                outputTokens: parsed.usage.completion_tokens,
              },
            }
          }
        } catch {
          // Skip unparseable chunks
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  yield { done: true }
}

// ─── Public API ─────────────────────────────────────────────────────

export async function* streamChatCompletion(
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  systemPrompt?: string | null
): AsyncGenerator<StreamChunk> {
  if (isClaudeModel(model)) {
    yield* streamClaude(apiKey, model, messages, systemPrompt)
  } else {
    yield* streamOpenAICompatible(apiKey, model, messages)
  }
}

export async function generateImage(
  apiKey: string,
  prompt: string,
  size: string = "1024x1024"
): Promise<{ taskId: string } | { error: string }> {
  const response = await fetch(
    "https://api.kie.ai/api/v1/gpt4o-image/generate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ prompt, size }),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    return { error: `Image generation failed: ${text}` }
  }

  const data = await response.json()
  if (data.taskId) {
    return { taskId: data.taskId }
  }
  return { error: data.message ?? "Failed to start image generation" }
}

export async function queryImageTask(
  apiKey: string,
  taskId: string
): Promise<{
  status: "generating" | "success" | "failed"
  resultUrls?: string[]
  error?: string
}> {
  const response = await fetch(
    `https://api.kie.ai/api/v1/gpt4o-image/record-info?taskId=${taskId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    }
  )

  if (!response.ok) {
    return { status: "failed", error: `Query failed: ${response.status}` }
  }

  const data = await response.json()

  // successFlag: 0=generating, 1=success, 2=failed
  switch (data.successFlag) {
    case 0:
      return { status: "generating" }
    case 1:
      return { status: "success", resultUrls: data.resultUrls }
    case 2:
      return { status: "failed", error: data.message ?? "Image generation failed" }
    default:
      return { status: "generating" }
  }
}
