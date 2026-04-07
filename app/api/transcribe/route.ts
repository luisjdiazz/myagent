import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()
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

    const apiKey = user.kieApiKey
    if (!apiKey) {
      return Response.json(
        { error: "No API key configured. Go to Settings to add your KIE.AI API key." },
        { status: 400 }
      )
    }

    const formData = await req.formData()
    const audio = formData.get("audio") as File
    if (!audio) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Forward to KIE.AI Whisper endpoint (OpenAI-compatible)
    const whisperFormData = new FormData()
    whisperFormData.append("file", audio, "audio.webm")
    whisperFormData.append("model", "whisper-1")
    whisperFormData.append("language", "auto")

    const response = await fetch("https://api.kie.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json(
        { error: `Transcription failed: ${errorText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    return Response.json({ text: result.text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription error"
    return Response.json({ error: message }, { status: 500 })
  }
}
