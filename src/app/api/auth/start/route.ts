import { NextResponse, type NextRequest } from "next/server";
import { verifyme, verifymeErrorResponse } from "@/lib/verifyme";
import { parseTarget } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { savePending } from "@/lib/session";

// Step 1: email or phone in → code sent.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = parseTarget(body?.target);
  if (!parsed) {
    return NextResponse.json(
      { error: "Enter an email, or a phone number like +85512345678." },
      { status: 400 },
    );
  }

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
    await savePending({ token, target: parsed.target, channel: parsed.channel });
    return NextResponse.json({ channel: parsed.channel, expiresAt: exp });
  } catch (err) {
    return verifymeErrorResponse(err);
  }
}
