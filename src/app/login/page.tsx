import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only allow same-site relative redirects.
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (await getCurrentUser()) redirect(redirectTo);

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
