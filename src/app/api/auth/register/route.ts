import { NextResponse, type NextRequest } from "next/server";
import { parseName, parseTarget } from "@/lib/validation";
import { sendCode } from "@/lib/send-code";
import { userExists } from "@/lib/users";

// Sign-up step 1: name + email or phone in → code sent.
// Step 2 is the shared /api/auth/verify, which creates the account.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const name = parseName(body?.name);
  if (!name) {
    return NextResponse.json({ error: "Enter your name (up to 100 characters)." }, { status: 400 });
  }
  const parsed = parseTarget(body?.target);
  if (!parsed) {
    return NextResponse.json(
      { error: "Enter an email, or a phone number like +85512345678." },
      { status: 400 },
    );
  }

  // Checked before sending so we don't spend a code on an existing account.
  if (await userExists(parsed.target, parsed.channel)) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists. Sign in instead." },
      { status: 409 },
    );
  }

  return sendCode(req, parsed, { kind: "register", name });
}
