"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"target" | "code">("target");
  const [target, setTarget] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const r = await post<{ channel: "email" | "sms" }>("/api/auth/start", { target });
      setChannel(r.channel);
      setCode("");
      setStep("code");
      setCooldown(RESEND_SECONDS);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(value: string) {
    setBusy(true);
    setError(null);
    try {
      await post("/api/auth/verify", { code: value });
      router.replace(redirectTo);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setCode("");
      setBusy(false);
    }
  }

  if (step === "target") {
    return (
      <Card className="w-full max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendCode();
          }}
          className="flex flex-col gap-6"
        >
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>We&apos;ll send you a one-time code.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Label htmlFor="target">Email or phone</Label>
            <Input
              id="target"
              autoComplete="username"
              placeholder="you@example.com or +85512345678"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-invalid={!!error}
              autoFocus
              required
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={busy || !target.trim()}>
              {busy && <Loader2 className="animate-spin" />}
              Send code
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Enter code</CardTitle>
        <CardDescription>
          Sent by {channel === "email" ? "email" : "SMS"} to{" "}
          <span className="text-foreground font-medium">{target.trim()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <InputOTP
          maxLength={CODE_LENGTH}
          value={code}
          onChange={setCode}
          onComplete={verify}
          disabled={busy}
          autoFocus
          inputMode="numeric"
          pattern="^[0-9]+$"
          aria-invalid={!!error}
        >
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <InputOTPSlot key={i} index={i} className="size-11 text-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {busy && <Loader2 className="text-muted-foreground size-4 animate-spin" />}
        {error && <p className="text-destructive text-center text-sm">{error}</p>}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep("target");
            setError(null);
          }}
          disabled={busy}
        >
          <ArrowLeft /> Change
        </Button>
        <Button variant="link" size="sm" onClick={sendCode} disabled={busy || cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </Button>
      </CardFooter>
    </Card>
  );
}
