import { createTRPCRouter, publicProcedure } from "../trpc"
import type { ModelInfo } from "@/types"

const MODELS: ModelInfo[] = [
  {
    id: "gpt-5-2",
    name: "GPT-5.2",
    provider: "OpenAI",
    cost: "~$0.05/msg",
    status: "stable",
  },
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
  },
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
  {
    id: "gpt-image",
    name: "GPT Image (4o)",
    provider: "OpenAI",
    type: "image",
    cost: "~$0.04/image",
    status: "stable",
  },
]

export const modelsRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return MODELS
  }),
})
