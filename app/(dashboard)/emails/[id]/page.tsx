import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "../../../../src/lib/auth";
import { db } from "../../../../src/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailLogDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireSession();
  if (!session) notFound();

  const log = await db.emailLog.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true, company: true, ownerId: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!log) notFound();
  if (session.user.role !== "ADMIN" && log.customer?.ownerId !== session.user.id) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email details</h1>
          <p className="text-sm text-muted-foreground">
            Status: {log.status} ·{" "}
            {new Date(log.sentAt ?? log.createdAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/emails" className="text-muted-foreground hover:underline">
            Back to email logs
          </Link>
          <Link
            href={`/customers/${log.customerId}`}
            className="text-muted-foreground hover:underline"
          >
            Open customer
          </Link>
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
        <div className="grid gap-2 md:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="mt-1 font-medium">
              {log.customer?.name ?? "Unknown customer"}{" "}
              {log.customer?.company ? (
                <span className="text-xs text-muted-foreground">
                  ({log.customer.company})
                </span>
              ) : null}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created by</div>
            <div className="mt-1">
              {log.createdBy?.name ?? "-"}{" "}
              <span className="text-xs text-muted-foreground">
                ({log.createdBy?.email ?? "-"})
              </span>
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">To</div>
            <div className="mt-1">{log.toEmail}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">From</div>
            <div className="mt-1">{log.fromEmail}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs text-muted-foreground">Subject</div>
            <div className="mt-1 font-medium">{log.subject}</div>
          </div>
          {log.providerMessageId ? (
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground">Provider</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {log.provider} · messageId: {log.providerMessageId}
              </div>
            </div>
          ) : null}
        </div>

        {log.error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {log.error}
          </div>
        ) : null}

        <div>
          <div className="text-xs text-muted-foreground">Body (plain text)</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-md border border-border/60 bg-background p-3 text-xs">
            {log.bodyText}
          </pre>
        </div>
      </div>
    </div>
  );
}

