import type { Metadata } from "next";

import { AuthSessionProvider } from "@/components/auth-session-provider";
import { NavHeader } from "@/components/nav-header";

import "./globals.css";

export const metadata: Metadata = {
  title: "Recipeli",
  description: "A web-first recipe tracker built around taste, memory, composite rankings, and head-to-head comparisons."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionProvider>
          <div className="mx-auto min-h-screen max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
            <NavHeader />
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}