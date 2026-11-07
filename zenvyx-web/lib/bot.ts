import "server-only";
import { createHash, createHmac } from "crypto";
import { env } from "./env";

export class BotError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Signed request to the Zenvyx bot. The bot re-checks the user's Discord permissions itself. */
export async function bot<T>(path: string, userId: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();
  const body = init?.body === undefined ? "" : JSON.stringify(init.body);
  const ts = Math.floor(Date.now() / 1000).toString();
  const message = [ts, method, path, userId, createHash("sha256").update(body).digest("hex")].join("\n");
  const sig = createHmac("sha256", env("BOT_API_SECRET")).update(message).digest("hex");

  let res: Response;
  try {
    res = await fetch(env("BOT_API_URL").replace(/\/+$/, "") + path, {
      method,
      body: body || undefined,
      headers: { "Content-Type": "application/json", "X-Z-Time": ts, "X-Z-User": userId, "X-Z-Sig": sig },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new BotError(502, "Can't reach the Zenvyx bot. Is it online and is the API port open?");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new BotError(res.status, (data as { detail?: string }).detail || "Bot API error");
  return data as T;
}
