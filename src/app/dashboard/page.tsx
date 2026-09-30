import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const fmt = (d: Date | null) =>
  d ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(d) : "—";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login"); // cookie present but session expired/revoked

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">You&apos;re signed in</CardTitle>
          <CardDescription>{user.email ?? user.phone}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="truncate font-mono">{user.id}</dd>
            <dt className="text-muted-foreground">Member since</dt>
            <dd>{fmt(user.created_at)}</dd>
            <dt className="text-muted-foreground">Last sign-in</dt>
            <dd>{fmt(user.last_login_at)}</dd>
          </dl>
        </CardContent>
        <CardFooter>
          <form action="/api/auth/logout" method="post" className="w-full">
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
