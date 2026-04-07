# MyAgent — Multi-model AI Chat Platform

## Stack
- Next.js 15 (App Router), TypeScript strict, Tailwind CSS v4, shadcn/ui
- tRPC v11, Drizzle ORM, PostgreSQL via Supabase, Supabase Auth
- KIE.AI API (OpenAI-compatible) for multi-model LLM access

## Key commands
```bash
npm run dev          # Dev server
npx tsc --noEmit     # Type check (run before commits)
npx drizzle-kit generate && npx drizzle-kit push  # After schema changes
npx shadcn@latest add [component]  # Add shadcn component
```

## Architecture
- API key (`KIE_AI_API_KEY`) is server-only fallback — users can bring their own
- Streaming via SSE at `POST /api/chat`
- Image generation at `POST /api/images/generate` + `GET /api/images/[taskId]`
- tRPC routers: conversations, messages, models, user
- Auth guard in middleware.ts (server-side redirect)

## Conventions
- Components: PascalCase.tsx, hooks: use-kebab-case.ts
- Server Components by default, `'use client'` only when needed
- Zod validation on all tRPC inputs
