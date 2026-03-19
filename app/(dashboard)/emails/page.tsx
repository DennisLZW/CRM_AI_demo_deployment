import Link from "next/link";
import { requireSession } from "../../../src/lib/auth";
import { db } from "../../../src/lib/db";

export default async function EmailsPage() {
  const session = await requireSession();
  const limit = 50;

  const logs =
    session?.user?.role === "ADMIN"
      ? await db.emailLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            customer: { select: { id: true, name: true, company: true } },
            createdBy: { select: { name: true, email: true } },
          },
        })
      : await db.emailLog.findMany({
          orderBy: { createdAt: "desc" },
          take: limit,
          where: { customer: { ownerId: session?.user?.id } },
          include: {
            customer: { select: { id: true, name: true, company: true } },
            createdBy: { select: { name: true, email: true } },
          },
        });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email logs</h1>
        <p className="text-sm text-muted-foreground">
          Last {limit} email sending records (across customers). Click a customer to open details.
        </p>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
        {logs.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No email logs yet. Generate a draft and send an email from a customer page.
          </div>
        ) : (
          <ul className="space-y-3">
            {logs.map((l: any) => (
              <li
                key={l.id}
                className="rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {l.status}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <Link
                      href={`/customers/${l.customer?.id ?? l.customerId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {l.customer?.name ?? "Unknown customer"}
                    </Link>
                    {l.customer?.company ? (
                      <span className="text-xs text-muted-foreground">
                        ({l.customer.company})
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(l.sentAt ?? l.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{l.subject}</div>
                    <Link
                      href={`/emails/${l.id}`}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      View full
                    </Link>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    To: {l.toEmail} · From: {l.fromEmail} · By:{" "}
                    {l.createdBy?.name ?? "-"}
                  </div>
                  {l.bodyText ? (
                    <div className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {String(l.bodyText).slice(0, 200)}
                      {String(l.bodyText).length > 200 ? "…" : ""}
                    </div>
                  ) : null}
                  {l.error ? (
                    <div className="mt-2 text-xs text-destructive">
                      Error: {l.error}
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

