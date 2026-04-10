"use client";

import { FormEvent, useState } from "react";
import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (mode === "register") {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ displayName, email, password }),
        });

        if (!registerResponse.ok) {
          const payload = (await registerResponse.json()) as { error?: string };
          setError(payload.error || "Unable to create account.");
          return;
        }
      }

      const loginResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!loginResult || loginResult.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push(callbackUrl as Route);
      router.refresh();
    } catch {
      setError("Unable to continue right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl">
      <section className="rounded-[2.5rem] border border-white/10 bg-[linear-gradient(140deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--accent)]">Account</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-[0.95] text-[var(--foreground)] sm:text-6xl">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
          Use your account to keep rankings private to followers and unlock social actions.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              Display name
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
                placeholder="Cam Webster"
              />
            </label>
          ) : null}

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[1.5rem] border border-white/10 bg-black/15 px-5 py-4 text-base normal-case tracking-normal text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]"
              placeholder="At least 8 characters"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--background)] transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
          >
            {saving
              ? "Working..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-[var(--muted)]">
          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "register" : "signin")}
            className="transition hover:text-[var(--foreground)]"
          >
            {mode === "signin"
              ? "Need an account? Register"
              : "Already have an account? Sign in"}
          </button>
          <Link href="/" className="transition hover:text-[var(--foreground)]">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl" />}>
      <LoginContent />
    </Suspense>
  );
}
