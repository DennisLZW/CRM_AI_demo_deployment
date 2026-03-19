"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type EmailLogItem = {
  id: string;
  customerId: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  status: string;
  error: string | null;
  provider: string;
  providerMessageId: string | null;
  createdAt: string;
  sentAt: string | null;
  createdBy: { name: string; email: string };
};

function formatTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export function EmailLogsPanel(props: { customerId: string }) {
  const { customerId } = props;
  const [items, setItems] = useState<EmailLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => "Email logs", []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/email/logs?customerId=${encodeURIComponent(customerId)}&take=20`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load email logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return (
    <div className="rounded-md border border-border bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">{title}</div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {error ? (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      {items.length ? (
        <div className="mt-3 space-y-2">
          {items.map((it) => (
            <div
              key={it.id}
              className="rounded-md border border-border/60 bg-background px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{it.subject}</div>
                <div className="text-xs text-muted-foreground">
                  {it.status} · {formatTime(it.sentAt ?? it.createdAt)}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                To: {it.toEmail} · From: {it.fromEmail} · By: {it.createdBy?.name ?? "-"}
              </div>
              {it.error ? (
                <div className="mt-2 text-xs text-destructive">
                  Error: {it.error}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-xs text-muted-foreground">
          No email sending records yet. After you send an email, results (sent/failed) will appear here.
        </div>
      )}
    </div>
  );
}

