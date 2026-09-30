import "server-only";
import { NextResponse } from "next/server";
import { Verifyme, VerifymeError } from "@cubis/verifyme";

// Reads VERIFYME_API_KEY (and optional VERIFYME_URL).
export const verifyme = Verifyme.fromEnv();

/** Map Verifyme failures to safe client responses. */
export function verifymeErrorResponse(err: unknown) {
  if (err instanceof VerifymeError) {
    console.error(`[verifyme] ${err.status} ${err.message} trace=${err.traceId}`);
    if (err.status === 429) {
      return NextResponse.json(
        { error: "Too many requests. Try again shortly." },
        {
          status: 429,
          headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
        },
      );
    }
    if (err.status === 403) {
      return NextResponse.json({ error: "This request was blocked." }, { status: 403 });
    }
  } else {
    console.error("[verifyme]", err);
  }
  return NextResponse.json({ error: "Verification service unavailable." }, { status: 502 });
}
