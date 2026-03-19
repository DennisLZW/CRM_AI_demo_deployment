"use client";

import { signOut, useSession } from "next-auth/react";

export function DashboardHeader() {
  const { data, status } = useSession();
  const user = (data as any)?.user;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="text-sm text-muted-foreground">AI-powered CRM Demo</div>

      <div className="flex items-center gap-3 text-sm">
        {status === "loading" ? (
          <span className="text-muted-foreground">Loading...</span>
        ) : user ? (
          <>
            <span className="text-xs text-muted-foreground">
              {user.name ?? user.email} · {user.role}
            </span>
            <button
              type="button"
              className="h-8 rounded-md border border-border bg-background px-3 text-xs hover:bg-muted"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Sign out
            </button>
          </>
        ) : (
          <span className="text-muted-foreground">Not signed in</span>
        )}
      </div>
    </header>
  );
}

