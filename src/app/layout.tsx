import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Passwordless sign-in with a one-time code",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-svh font-sans">{children}</body>
    </html>
  );
}
