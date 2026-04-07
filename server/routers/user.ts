import { z } from "zod"
import { eq } from "drizzle-orm"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { userProfiles } from "@/db/schema"

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      hasApiKey: !!ctx.user.kieApiKey,
      createdAt: ctx.user.createdAt.toISOString(),
    }
  }),

  update: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        kieApiKey: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const setValues: Record<string, unknown> = {}
      if (input.name !== undefined) setValues.name = input.name
      if (input.kieApiKey !== undefined) setValues.kieApiKey = input.kieApiKey

      if (Object.keys(setValues).length === 0) {
        return { success: true }
      }

      await ctx.db
        .update(userProfiles)
        .set(setValues)
        .where(eq(userProfiles.id, ctx.user.id))

      return { success: true }
    }),
})
