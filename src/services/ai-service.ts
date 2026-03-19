import { z } from "zod";
import { geminiGenerateJsonText } from "../lib/gemini";

export const insightSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  nextActions: z
    .array(
      z.object({
        title: z.string(),
        reason: z.string().optional(),
        dueInDays: z.number().int().min(0).max(60).default(7),
        priority: z
          .preprocess(
            (v) =>
              typeof v === "string" ? v.toLowerCase().trim() : v,
            z.enum(["low", "medium", "high"]).catch("medium"),
          )
          .default("medium"),
      }),
    )
    .default([]),
});

export type Insight = z.infer<typeof insightSchema>;

export const emailDraftSchema = z.object({
  subject: z.string(),
  bodyText: z.string(),
  callToAction: z.string().optional(),
  followUpInDays: z
    .preprocess((v) => {
      if (typeof v === "string") {
        const n = Number.parseInt(v, 10);
        return Number.isNaN(n) ? v : n;
      }
      return v;
    }, z.number().int().min(0).max(60))
    .optional(),
});

export type EmailDraft = z.infer<typeof emailDraftSchema>;

async function generateJsonText(args: {
  system: string;
  user: string;
  geminiModel?: string;
}) {
  return await geminiGenerateJsonText({
    model: args.geminiModel,
    system: args.system,
    user: args.user,
  });
}

function extractFirstJsonObject(text: string) {
  const trimmed = text.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    // fall through
  }
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch?.[1]) {
    const inside = fenceMatch[1].trim();
    JSON.parse(inside);
    return inside;
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    const slice = trimmed.slice(first, last + 1);
    JSON.parse(slice);
    return slice;
  }
  throw new Error("AI output is not valid JSON");
}

function formatContext(input: {
  customer: {
    name: string;
    email?: string | null;
    company?: string | null;
    status: string;
    notes?: string | null;
  };
  activities: Array<{
    type: string;
    content: string;
    occurredAt: Date;
  }>;
}) {
  const c = input.customer;
  const lines = [
    `CustomerName: ${c.name}`,
    `CustomerEmail: ${c.email ?? "-"}`,
    `CustomerCompany: ${c.company ?? "-"}`,
    `CustomerStatus: ${c.status}`,
    `CustomerNotes: ${c.notes ?? "-"}`,
    "",
    "RecentActivities:",
    ...input.activities.map(
      (a) => `- [${a.occurredAt.toISOString()}] ${a.type}: ${a.content}`,
    ),
  ];
  return lines.join("\n");
}

export async function generateInsight(input: {
  customer: {
    name: string;
    email?: string | null;
    company?: string | null;
    status: string;
    notes?: string | null;
  };
  activities: Array<{ type: string; content: string; occurredAt: Date }>;
}) {
  const context = formatContext(input);

  const text = await generateJsonText({
    system:
      "You are a CRM assistant. Use ONLY the provided context. Do not invent facts. Output STRICT JSON only. Write everything in English.",
    user:
      "Analyze customer progress and suggest next actions.\nReturn JSON with keys: summary, keyPoints, risks, opportunities, nextActions[{title,reason,dueInDays,priority}].\n\nContext:\n" +
      context,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  });

  const jsonText = extractFirstJsonObject(text);
  const parsed = insightSchema.safeParse(JSON.parse(jsonText));
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    const preview = jsonText.slice(0, 500);
    throw new Error(
      `AI insight schema validation failed: ${issues}. Output preview: ${preview}`,
    );
  }
  return parsed.data;
}

export async function generateEmailDraft(input: {
  customer: {
    name: string;
    email?: string | null;
    company?: string | null;
    status: string;
    notes?: string | null;
  };
  activities: Array<{ type: string; content: string; occurredAt: Date }>;
  purpose: string;
  tone: string;
  mustInclude?: string[];
}) {
  const context = formatContext({
    customer: input.customer,
    activities: input.activities,
  });
  const text = await generateJsonText({
    system:
      "You are a sales assistant writing concise plain-text emails. Use ONLY the provided context. Do not invent facts. Output STRICT JSON only. Write everything in English.",
    user:
      `Write a follow-up email draft.\nPurpose: ${input.purpose}\nTone: ${input.tone}\nMustInclude: ${(
        input.mustInclude ?? []
      ).join(", ") || "-"}\nReturn JSON with keys: subject, bodyText, callToAction, followUpInDays.\n\nContext:\n` +
      context,
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
  });

  const jsonText = extractFirstJsonObject(text);
  const parsed = emailDraftSchema.safeParse(JSON.parse(jsonText));
  if (!parsed.success) {
    const issues = parsed.error.issues
      .slice(0, 8)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    const preview = jsonText.slice(0, 500);
    throw new Error(
      `AI email draft schema validation failed: ${issues}. Output preview: ${preview}`,
    );
  }
  return parsed.data;
}

