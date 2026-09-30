import { NextResponse, type NextRequest } from "next/server";
import { parseTarget } from "@/lib/validation";
import { sendCode } from "@/lib/send-code";

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

  return sendCode(req, parsed, { kind: "login" });
}
