"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type Activity = {
  id: string;
  type: string;
  content: string;
  occurredAt: string;
};

interface ActivitiesPanelProps {
  customerId: string;
  initialActivities: Activity[];
}

export function ActivitiesPanel({
  customerId,
  initialActivities,
}: ActivitiesPanelProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [type, setType] = useState("note");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, type, content }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert("Failed to create activity: " + (err.error || res.statusText));
      return;
    }
    const created = (await res.json()) as Activity;
    setContent("");
    startTransition(() => {
      setActivities((prev) => [created, ...prev]);
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium">Activities</div>
        <span className="text-xs text-muted-foreground">
          Manual creation is supported for now; AI generation will be added later.
        </span>
      </div>

      <form onSubmit={handleCreate} className="space-y-2 rounded-md bg-muted/40 p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="email">Email</option>
          </select>
          <div className="flex-1">
            <textarea
              className="h-16 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
              placeholder="Record a follow-up (e.g., call/meeting notes)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            className="self-start"
            disabled={isPending}
          >
            {isPending ? "Creating..." : "Add activity"}
          </Button>
        </div>
      </form>

      {activities.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground">
          No activities yet. Create one using the form above.
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-border/60 bg-background px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                  {a.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.occurredAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-sm whitespace-pre-wrap">{a.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

