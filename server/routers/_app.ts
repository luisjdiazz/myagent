import { createTRPCRouter } from "../trpc"
import { conversationsRouter } from "./conversations"
import { messagesRouter } from "./messages"
import { modelsRouter } from "./models"
import { userRouter } from "./user"

export const appRouter = createTRPCRouter({
  conversations: conversationsRouter,
  messages: messagesRouter,
  models: modelsRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
