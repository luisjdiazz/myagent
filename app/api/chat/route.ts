import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/db"
import { userProfiles, conversations, messages } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { streamChatCompletion } from "@/lib/kie-client"

export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const supabase = await createClient()
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser()

    if (!supabaseUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      })
    }

    // 2. Get user profile
    const [user] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.supabaseId, supabaseUser.id))
      .limit(1)

    if (!user) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
      })
    }

    // 3. Parse request
    const body = await req.json()
    const { conversationId, message: content, model: modelOverride } = body as {
      conversationId: string
      message: string
      model?: string
    }

    if (!conversationId || !content) {
      return new Response(
        JSON.stringify({ error: "conversationId and message are required" }),
        { status: 400 }
      )
    }

    // 4. Verify conversation ownership
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, user.id)
        )
      )
      .limit(1)

    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404 }
      )
    }

    // 5. Resolve API key: user key first, fallback to server key
    const apiKey = user.kieApiKey || process.env.KIE_AI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "No API key configured. Set your KIE.AI API key in settings or contact the administrator.",
        }),
        { status: 400 }
      )
    }

    // 6. Save user message
    await db.insert(messages).values({
      conversationId,
      role: "user",
      content,
    })

    // 7. Build messages array for the API
    const existingMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt)

    const apiMessages = existingMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // 8. Resolve model: request override > conversation model
    const activeModel = modelOverride || conversation.model

    // Update conversation model if overridden
    if (modelOverride && modelOverride !== conversation.model) {
      await db
        .update(conversations)
        .set({ model: modelOverride })
        .where(eq(conversations.id, conversationId))
    }

    // 9. Stream from KIE.AI
    const encoder = new TextEncoder()
    let fullResponse = ""
    let totalTokens: number | null = null

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatCompletion(
            apiKey,
            activeModel,
            apiMessages,
            conversation.systemPrompt
          )) {
            if (chunk.error) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ error: chunk.error })}\n\n`
                )
              )
              break
            }

            if (chunk.token) {
              fullResponse += chunk.token
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ token: chunk.token })}\n\n`
                )
              )
            }

            if (chunk.usage) {
              totalTokens =
                (chunk.usage.inputTokens ?? 0) +
                (chunk.usage.outputTokens ?? 0)
            }

            if (chunk.done) {
              // 9. Save assistant message
              if (fullResponse) {
                await db.insert(messages).values({
                  conversationId,
                  role: "assistant",
                  content: fullResponse,
                  model: activeModel,
                  tokensUsed: totalTokens,
                })

                // 10. Auto-title after first exchange
                if (conversation.title === "New Chat") {
                  const title = generateTitle(content)
                  await db
                    .update(conversations)
                    .set({ title })
                    .where(eq(conversations.id, conversationId))

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ title })}\n\n`
                    )
                  )
                }
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
              )
            }
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown streaming error"
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return new Response(JSON.stringify({ error: message }), { status: 500 })
  }
}

/**
 * Generate a short title from the user's first message.
 * Takes the first ~60 chars, truncating at a word boundary.
 */
function generateTitle(userMessage: string): string {
  const cleaned = userMessage.replace(/\s+/g, " ").trim()
  if (cleaned.length <= 60) return cleaned
  const truncated = cleaned.slice(0, 60)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated) + "..."
}
