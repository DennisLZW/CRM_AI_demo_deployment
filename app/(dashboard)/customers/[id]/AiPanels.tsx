"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

type Insight = {
  summary: string;
  keyPoints?: string[];
  risks?: string[];
  opportunities?: string[];
  nextActions?: Array<{
    title: string;
    reason?: string;
    dueInDays?: number;
    priority?: "low" | "medium" | "high";
  }>;
};

type EmailDraft = {
  subject: string;
  bodyText: string;
  callToAction?: string;
  followUpInDays?: number;
};

export function AiPanels(props: {
  customerId: string;
  customerEmail: string | null;
}) {
  const { customerId, customerEmail } = props;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const [insight, setInsight] = useState<Insight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState("followup");
  const [tone, setTone] = useState("professional");
  const [toEmail, setToEmail] = useState(customerEmail ?? "");
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendOk, setSendOk] = useState<string | null>(null);

  async function runInsight() {
    setInsightLoading(true);
    setInsightError(null);
    try {
      const res = await fetch("/api/ai/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, windowDays: 30 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = (await res.json()) as Insight;
      setInsight(data);
    } catch (e: any) {
      setInsightError(e?.message ?? "Failed to generate insight");
    } finally {
      setInsightLoading(false);
    }
  }

  async function runDraft() {
    setDraftLoading(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/ai/email/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, purpose, tone, windowDays: 30 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      const data = (await res.json()) as EmailDraft;
      setDraft(data);
      setSubject(data.subject);
      setBodyText(data.bodyText);
    } catch (e: any) {
      setDraftError(e?.message ?? "Failed to generate email draft");
    } finally {
      setDraftLoading(false);
    }
  }

  async function sendEmail() {
    setSendLoading(true);
    setSendError(null);
    setSendOk(null);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          toEmail,
          subject,
          bodyText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      setSendOk(
        data.messageId
          ? `Sent (messageId: ${data.messageId})`
          : "Sent",
      );
    } catch (e: any) {
      setSendError(e?.message ?? "Send failed");
    } finally {
      setSendLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">AI Insight</div>
          <Button size="sm" onClick={runInsight} disabled={insightLoading}>
            {insightLoading ? "Generating..." : "Generate insight"}
          </Button>
        </div>

        {insightError ? (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {insightError}
          </div>
        ) : null}

        {insight ? (
          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Summary</div>
              <div className="mt-1">{insight.summary}</div>
            </div>

            {insight.nextActions?.length ? (
              <div>
                <div className="text-xs text-muted-foreground">Next actions</div>
                <ul className="mt-1 space-y-2">
                  {insight.nextActions.map((a, idx) => (
                    <li key={idx} className="rounded-md border border-border/60 bg-background px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.priority ?? "medium"} · {a.dueInDays ?? 7}d
                        </div>
                      </div>
                      {a.reason ? (
                        <div className="mt-1 text-xs text-muted-foreground">{a.reason}</div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 text-xs text-muted-foreground">
            Click "Generate insight" to summarize progress from the customer's recent activities and suggest next steps.
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">Email Assistant (Plain Text)</div>
          <div className="flex items-center gap-2">
            <Link
              href={`/api/gmail/oauth/start?returnTo=${encodeURIComponent(returnTo)}`}
              className="text-xs text-muted-foreground hover:underline"
            >
              Connect Gmail
            </Link>
            <Button size="sm" onClick={runDraft} disabled={draftLoading}>
              {draftLoading ? "Generating..." : "Generate draft"}
            </Button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Purpose</div>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            >
              <option value="followup">followup</option>
              <option value="meeting_summary">meeting_summary</option>
              <option value="overdue">overdue</option>
              <option value="proposal">proposal</option>
            </select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Tone</div>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              <option value="professional">professional</option>
              <option value="friendly">friendly</option>
              <option value="concise">concise</option>
            </select>
          </div>
        </div>

        {draftError ? (
          <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {draftError}
          </div>
        ) : null}

        <div className="mt-3 space-y-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">To</div>
            <Input
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="Recipient email"
              type="email"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Subject</div>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Body</div>
            <Textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Email body (plain text)"
              rows={10}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {draft?.followUpInDays != null
                ? `Recommended follow up in ${draft.followUpInDays} days`
                : null}
            </div>
            <Button
              size="sm"
              onClick={sendEmail}
              disabled={sendLoading || !toEmail || !subject || !bodyText}
            >
              {sendLoading ? "Sending..." : "Send email"}
            </Button>
          </div>

          {sendOk ? (
            <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
              {sendOk}
            </div>
          ) : null}
          {sendError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {sendError}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

