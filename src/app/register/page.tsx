import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { LoginForm } from "../login/login-form";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <LoginForm mode="register" redirectTo="/dashboard" />
    </main>
  );
}
