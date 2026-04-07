import { createTRPCRouter, publicProcedure } from "../trpc"
import type { ModelInfo } from "@/types"

const MODELS: ModelInfo[] = [
  // OpenAI
  {
    id: "gpt-5-2",
    name: "GPT-5.2",
    provider: "OpenAI",
    cost: "~$0.05/msg",
    status: "stable",
  },
  // Anthropic
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    cost: "~$0.08/msg",
    status: "intermittent",
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    cost: "~$0.03/msg",
    status: "intermittent",
  },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "Anthropic",
    cost: "~$0.06/msg",
    status: "intermittent",
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "Anthropic",
    cost: "~$0.02/msg",
    status: "intermittent",
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    cost: "~$0.005/msg",
    status: "intermittent",
  },
  // Google
  {
    id: "gemini-3.1-pro",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    cost: "~$0.03/msg",
    status: "stable",
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    provider: "Google",
    cost: "~$0.03/msg",
    status: "stable",
  },
  {
    id: "gemini-3-flash",
    name: "Gemini 3 Flash",
    provider: "Google",
    cost: "~$0.01/msg",
    status: "stable",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    cost: "~$0.02/msg",
    status: "stable",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    cost: "~$0.01/msg",
    status: "stable",
    recommended: true,
  },
  // DeepSeek
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    provider: "DeepSeek",
    cost: "~$0.005/msg",
    status: "intermittent",
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    cost: "~$0.01/msg",
    status: "intermittent",
  },
  // Image Generation
  {
    id: "gpt-image",
    name: "GPT Image (4o)",
    provider: "Image Generation",
    type: "image",
    cost: "~$0.04/image",
    status: "stable",
  },
  {
    id: "nano-banana",
    name: "Nano Banana",
    provider: "Image Generation",
    type: "image",
    cost: "~$0.001/image",
    status: "stable",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    provider: "Image Generation",
    type: "image",
    cost: "~$0.01/image",
    status: "stable",
  },
]

export const modelsRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return MODELS
  }),
})
