import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="max-w-xl space-y-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          SmartCRM AI Demo
        </h1>
        <p className="text-muted-foreground">
          An AI-powered CRM demo. Manage customers and activities in the dashboard, and
          experience AI that organizes notes and drafts emails.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
        >
          Enter system
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-border px-6 py-2 text-sm font-medium hover:bg-muted"
        >
          View dashboard
        </Link>
      </div>
    </main>
  );
}

