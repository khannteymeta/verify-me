export type Channel = "email" | "sms";
export type Target = { target: string; channel: Channel };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164 = /^\+[1-9]\d{7,14}$/;

/** Accepts an email or an E.164 phone number (spaces, dashes, brackets allowed). */
export function parseTarget(raw: unknown): Target | null {
  const value = String(raw ?? "").trim();
  if (!value || value.length > 254) return null;
  if (EMAIL.test(value)) return { target: value.toLowerCase(), channel: "email" };
  const phone = value.replace(/[\s()-]/g, "");
  if (E164.test(phone)) return { target: phone, channel: "sms" };
  return null;
}

export function isCode(raw: unknown): raw is string {
  return typeof raw === "string" && /^\d{4,8}$/.test(raw);
}
