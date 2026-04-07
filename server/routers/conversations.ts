import { z } from "zod"
import { eq, desc, and, sql, count } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { conversations, messages } from "@/db/schema"

export const conversationsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: conversations.id,
          title: conversations.title,
          model: conversations.model,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
          messageCount: count(messages.id),
        })
        .from(conversations)
        .leftJoin(messages, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.userId, ctx.user.id))
        .groupBy(conversations.id)
        .orderBy(desc(conversations.updatedAt))
        .limit(input.limit)
        .offset(input.offset)

      return rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    }),

  create: protectedProcedure
    .input(
      z.object({
        model: z.string().min(1),
        systemPrompt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          userId: ctx.user.id,
          model: input.model,
          systemPrompt: input.systemPrompt ?? null,
        })
        .returning()

      return conversation
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.id, input.id),
            eq(conversations.userId, ctx.user.id)
          )
        )
        .limit(1)

      if (!conversation) {
        throw new Error("Conversation not found")
      }

      const msgs = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.id))
        .orderBy(messages.createdAt)

      return {
        ...conversation,
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
        messages: msgs.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
        messageCount: msgs.length,
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        model: z.string().optional(),
        systemPrompt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      // Verify ownership
      const [existing] = await ctx.db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1)

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("Conversation not found")
      }

      const setValues: Record<string, unknown> = {}
      if (updates.title !== undefined) setValues.title = updates.title
      if (updates.model !== undefined) setValues.model = updates.model
      if (updates.systemPrompt !== undefined)
        setValues.systemPrompt = updates.systemPrompt

      if (Object.keys(setValues).length === 0) {
        return { success: true }
      }

      await ctx.db
        .update(conversations)
        .set(setValues)
        .where(eq(conversations.id, id))

      return { success: true }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await ctx.db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, input.id))
        .limit(1)

      if (!existing || existing.userId !== ctx.user.id) {
        throw new Error("Conversation not found")
      }

      await ctx.db
        .delete(conversations)
        .where(eq(conversations.id, input.id))

      return { success: true }
    }),
})
