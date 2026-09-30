# verifyme-next

Passwordless sign-in with a one-time code (email or SMS) via
[Verifyme](https://docs.verifyme.cubis.tech).

**Stack:** Next.js 15 (App Router) · shadcn/ui + Tailwind v4 · PostgreSQL (users) · Redis (sessions, pending codes, rate limits)

## Run

```bash
npm install
cp .env.example .env.local        # add your vm_test_ key
docker compose up -d              # Postgres + Redis; schema.sql runs on first start
npm run dev                       # http://localhost:3000
```

Using your own Postgres instead of Docker? Run `npm run db:migrate` with
`DATABASE_URL` set.

With a **test** key nothing is delivered and no credits are spent. Read the
code in the Verifyme console → **Verifications**.

## How it works

```
Browser                       Next.js                      Redis / Postgres        Verifyme
  │ POST /api/auth/start ────▶ │ rate limit (ip, target) ──▶ Redis                      │
  │   { target }               │ verifyme.send() ──────────────────────────────────────▶ │ sends code
  │                            │ pending:{hash} = {token} ─▶ Redis (5 min)               │
  │ ◀── cookie vm_pending ─────│                                                         │
  │ POST /api/auth/verify ───▶ │ verifyme.check({token,code}) ─────────────────────────▶ │
  │   { code }                 │ upsert user ──────────────▶ Postgres                    │
  │                            │ sess:{hash} = {userId} ───▶ Redis (7 days)              │
  │ ◀── cookie sid ────────────│                                                         │
```

## Layout

```
src/
  middleware.ts               /dashboard/* without a cookie → /login
  app/
    login/page.tsx            server: redirects if already signed in
    login/login-form.tsx      client: two-step form (shadcn Card, Input, InputOTP)
    dashboard/page.tsx        protected page + sign-out
    api/auth/start/route.ts   send code
    api/auth/verify/route.ts  check code → user → session
    api/auth/logout/route.ts
  lib/
    session.ts                sessions + pending codes in Redis, getCurrentUser()
    users.ts                  Postgres queries
    verifyme.ts               SDK client + error → response mapping
    rate-limit.ts, validation.ts, db.ts, redis.ts
  components/ui/              shadcn components (button, card, input, label, input-otp)
db/schema.sql
```

Protect any server page with:

```ts
const user = await getCurrentUser();
if (!user) redirect("/login");
```

## Security notes

- The Verifyme token never reaches the browser; it lives in Redis behind an
  httpOnly `vm_pending` cookie scoped to `/api/auth`.
- Redis stores only a SHA-256 hash of each cookie value, so a leaked Redis
  dump can't be replayed as sessions.
- A new session ID is issued on every login. Cookies are `httpOnly`,
  `sameSite=lax`, and `secure` in production.
- Every wrong or expired code returns the same message. Verifyme burns the
  token after 5 wrong tries.
- Codes are limited to 10 per IP and 5 per email/phone every 15 minutes, on
  top of Verifyme's own limits.
- The user's IP and user-agent are forwarded so Verifyme's firewall judges
  the real client.

## Before production

- Use a live `vm_live_` key and follow Verifyme's
  [production checklist](https://docs.verifyme.cubis.tech/docs/production).
- Make sure `x-forwarded-for` comes from your own proxy (Vercel, nginx), or
  the per-IP limit can be spoofed.
- Next.js 16 renames `middleware.ts` to `proxy.ts`. Rename it if you upgrade.
