import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"
import { generateImage } from "@/lib/kie-client"

export async function POST(req: NextRequest) {
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

    const { prompt, size } = (await req.json()) as {
      prompt: string
      size?: string
    }

    if (!prompt) {
      return Response.json({ error: "prompt is required" }, { status: 400 })
    }

    const result = await generateImage(apiKey, prompt, size)

    if ("error" in result) {
      return Response.json({ error: result.error }, { status: 500 })
    }

    return Response.json({ taskId: result.taskId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return Response.json({ error: message }, { status: 500 })
  }
}
