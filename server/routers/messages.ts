import { z } from "zod"
import { eq, and } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { conversations, messages } from "@/db/schema"

export const messagesRouter = createTRPCRouter({
  listByConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify conversation ownership
      const [conversation] = await ctx.db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1)

      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Conversation not found")
      }

      const msgs = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(messages.createdAt)

      return msgs.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get message with conversation to verify ownership
      const [msg] = await ctx.db
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
        })
        .from(messages)
        .where(eq(messages.id, input.id))
        .limit(1)

      if (!msg) {
        throw new Error("Message not found")
      }

      const [conversation] = await ctx.db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, msg.conversationId))
        .limit(1)

      if (!conversation || conversation.userId !== ctx.user.id) {
        throw new Error("Not authorized")
      }

      await ctx.db.delete(messages).where(eq(messages.id, input.id))

      return { success: true }
    }),
})
