import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, PDF" },
        { status: 400 }
      )
    }

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File too large. Max 10MB." }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin"
    const fileName = `${user.id}/${crypto.randomUUID()}.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from("chat-uploads")
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      return Response.json({ error: `Upload failed: ${error.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("chat-uploads")
      .getPublicUrl(data.path)

    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"

    return Response.json({
      url: urlData.publicUrl,
      type: isImage ? "image" : isPdf ? "pdf" : "file",
      name: file.name,
      size: file.size,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload error"
    return Response.json({ error: message }, { status: 500 })
  }
}
