import { NextResponse, type NextRequest } from "next/server";
import { verifyme, verifymeErrorResponse } from "@/lib/verifyme";
import { isCode } from "@/lib/validation";
import { clearPending, createSession, getPending } from "@/lib/session";
import { upsertUserForLogin } from "@/lib/users";

// Step 2: code in → user signed in.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  const pending = await getPending();
  if (!pending) {
    return NextResponse.json(
      { error: "Your code expired. Request a new one." },
      { status: 400 },
    );
  }
  if (!isCode(code)) {
    return NextResponse.json({ error: "Enter the code you received." }, { status: 400 });
  }

  let success: boolean;
  try {
    ({ success } = await verifyme.check({ token: pending.token, code }));
  } catch (err) {
    return verifymeErrorResponse(err);
  }

  // Wrong, spent or expired. Verifyme burns the token after 5 wrong tries.
  if (!success) {
    return NextResponse.json({ error: "Wrong or expired code." }, { status: 400 });
  }

  const user = await upsertUserForLogin(pending.target, pending.channel);
  await clearPending();
  await createSession(user.id); // fresh session id on every login

  return NextResponse.json({ ok: true });
}
