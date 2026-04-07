import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function createContext(
  opts: FetchCreateContextFnOptions | { req: Request; resHeaders: Headers }
) {
  const supabase = await createClient()
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  let user: typeof userProfiles.$inferSelect | null = null

  if (supabaseUser) {
    const rows = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.supabaseId, supabaseUser.id))
      .limit(1)

    if (rows.length > 0) {
      user = rows[0]
    } else {
      // Auto-create profile on first login
      const [newUser] = await db
        .insert(userProfiles)
        .values({
          supabaseId: supabaseUser.id,
          email: supabaseUser.email ?? "",
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.email?.split("@")[0] ??
            "User",
        })
        .returning()
      user = newUser
    }
  }

  return { db, user, supabaseUser }
}

export type Context = Awaited<ReturnType<typeof createContext>>
