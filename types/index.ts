export interface ModelInfo {
  id: string
  name: string
  provider: string
  type?: "image"
  cost?: string
  status?: "stable" | "intermittent"
  recommended?: boolean
}

export interface Message {
  id: string
  role: "system" | "user" | "assistant"
  content: string
  model: string | null
  tokensUsed: number | null
  createdAt: string
}

export interface Conversation {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface ConversationDetail extends Conversation {
  systemPrompt: string | null
  messages: Message[]
}

export interface StreamChunk {
  token?: string
  usage?: { inputTokens?: number; outputTokens?: number }
  done?: boolean
  error?: string
}

export interface ImageTask {
  taskId: string
  status: "generating" | "success" | "failed"
  resultUrls?: string[]
}
