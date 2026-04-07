import "server-only"
import { createContext } from "@/server/context"
import { appRouter } from "@/server/routers/_app"

/**
 * Server-side tRPC caller for use in Server Components and Route Handlers.
 * Usage: const caller = await createCaller(); const data = await caller.models.list();
 */
export async function createCaller() {
  const ctx = await createContext({
    req: new Request("http://localhost"),
    resHeaders: new Headers(),
  })
  return appRouter.createCaller(ctx)
}
