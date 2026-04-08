import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles, conversations, messages } from "@/db/schema"
import { eq, sql, gte, and } from "drizzle-orm"

const ADMIN_EMAIL = "luisjdiazpromo@gmail.com"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return Response.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all user profiles
    const allUsers = await db.select().from(userProfiles)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(todayStart.getTime() - 7 * 86400000)

    const stats = await Promise.all(allUsers.map(async (u) => {
      // Get all conversations for this user
      const userConvs = await db.select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.userId, u.id))

      const convIds = userConvs.map(c => c.id)

      if (convIds.length === 0) {
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          hasApiKey: !!u.kieApiKey,
          createdAt: u.createdAt.toISOString(),
          messagesToday: 0,
          messagesWeek: 0,
          messagesTotal: 0,
          tokensTotal: 0,
          lastActive: null,
        }
      }

      // Count messages using SQL for efficiency
      const [totals] = await db.select({
        total: sql<number>`count(*)`,
        tokens: sql<number>`coalesce(sum(${messages.tokensUsed}), 0)`,
        lastActive: sql<string>`max(${messages.createdAt})`,
      }).from(messages)
        .where(sql`${messages.conversationId} IN (${sql.join(convIds.map(id => sql`${id}`), sql`,`)})`)

      const [todayCounts] = await db.select({
        count: sql<number>`count(*)`,
      }).from(messages)
        .where(and(
          sql`${messages.conversationId} IN (${sql.join(convIds.map(id => sql`${id}`), sql`,`)})`,
          gte(messages.createdAt, todayStart),
          eq(messages.role, "user")
        ))

      const [weekCounts] = await db.select({
        count: sql<number>`count(*)`,
      }).from(messages)
        .where(and(
          sql`${messages.conversationId} IN (${sql.join(convIds.map(id => sql`${id}`), sql`,`)})`,
          gte(messages.createdAt, weekStart),
          eq(messages.role, "user")
        ))

      return {
        id: u.id,
        email: u.email,
        name: u.name,
        hasApiKey: !!u.kieApiKey,
        createdAt: u.createdAt.toISOString(),
        messagesToday: Number(todayCounts?.count || 0),
        messagesWeek: Number(weekCounts?.count || 0),
        messagesTotal: Number(totals?.total || 0),
        tokensTotal: Number(totals?.tokens || 0),
        lastActive: totals?.lastActive || null,
      }
    }))

    return Response.json({ users: stats })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    return Response.json({ error: message }, { status: 500 })
  }
}
