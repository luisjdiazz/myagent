import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { queryImageTask } from "@/lib/kie-client"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [user] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.supabaseId, supabaseUser.id))
      .limit(1)

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    const apiKey = user.kieApiKey || process.env.KIE_AI_API_KEY
    if (!apiKey) {
      return Response.json({ error: "No API key configured" }, { status: 400 })
    }

    const { taskId } = await params

    const result = await queryImageTask(apiKey, taskId)
    return Response.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
