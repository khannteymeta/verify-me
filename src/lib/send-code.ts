import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { verifyme, verifymeErrorResponse } from "@/lib/verifyme";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { savePending, type PendingPurpose } from "@/lib/session";
import type { Target } from "@/lib/validation";

/**
 * Rate-limit, send a code via Verifyme, and park the token in Redis.
 * Shared by sign-in (/api/auth/start) and sign-up (/api/auth/register).
 */
export async function sendCode(req: NextRequest, parsed: Target, purpose: PendingPurpose) {
  const ip = clientIp(req.headers);
  for (const [key, limit] of [
    [`start:ip:${ip}`, 10],
    [`start:target:${parsed.target}`, 5],
  ] as const) {
    const rl = await rateLimit(key, limit, 15 * 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many codes requested. Try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
      );
    }
  }

  try {
    const { token, exp } = await verifyme.send({
      target: parsed.target,
      provider: parsed.channel,
      length: 6,
      timeout: 300,
      client: { ip, user_agent: req.headers.get("user-agent") ?? "" },
    });
    await savePending({ token, target: parsed.target, channel: parsed.channel, purpose });
    return NextResponse.json({ channel: parsed.channel, expiresAt: exp });
  } catch (err) {
    return verifymeErrorResponse(err);
  }
}
