import { NextResponse } from "next/server";
import { db } from "../../../../src/lib/db";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/(^\.)|(\.$)/g, "");
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const firstNames = [
    "Dennis",
    "Cinnis",
    "Alex",
    "Maya",
    "Leo",
    "Olivia",
    "Ethan",
    "Sophia",
    "Noah",
    "Ava",
    "Liam",
    "Emma",
    "Kai",
    "Yuki",
    "Chen",
    "Lin",
    "Wei",
    "Jia",
    "Hao",
    "Ting",
  ];
  const lastNames = [
    "Wang",
    "Li",
    "Zhang",
    "Liu",
    "Chen",
    "Yang",
    "Huang",
    "Zhao",
    "Wu",
    "Zhou",
    "Xu",
    "Sun",
    "Ma",
    "Zhu",
    "He",
    "Guo",
    "Lin",
    "Gao",
    "Luo",
    "Tang",
  ];
  const companies = [
    "Acme Robotics",
    "Nimbus Health",
    "Aurora Fintech",
    "BlueOak Logistics",
    "Cedar Retail",
    "Pioneer Energy",
    "Skyline Media",
    "Vertex AI Labs",
    "RiverStone Consulting",
    "ZenWorks SaaS",
    "Moonshot Studio",
    "Harbor Security",
  ];
  const statuses = ["prospect", "active", "won", "lost"] as const;
  const noteSnippets = [
    "Focus on quotation and delivery timeline",
    "Interested in competitor A; needs solution comparison",
    "Schedule a technical review next week",
    "Contract draft sent; waiting for feedback",
    "Budget is still being finalized",
    "Prefers a monthly subscription",
    "Needs SSO and audit logs",
    "Requests a PoC",
  ];
  const activityTypes = ["call", "meeting", "email", "note"] as const;
  const activityTemplates = {
    call: [
      "Discuss requirements and budget by phone; agree on the next follow-up date",
      "Confirm key decision-makers and the procurement process",
      "Clarify current pain points and success metrics",
    ],
    meeting: [
      "Review the proposal and discuss integration and rollout plans",
      "Align on scope and milestones; confirm next steps",
      "Demo the core product features; collect feedback and questions",
    ],
    email: [
      "Email the meeting notes and the next-step plan",
      "Follow up on the quotation and contract terms; wait for confirmation",
      "Send materials and case studies; invite additional information",
    ],
    note: [
      "Document customer concerns and key risks",
      "Update customer status and next to-dos",
      "Add contact details and preferences",
    ],
  } as const;

  const now = Date.now();
  const customersToCreate = Array.from({ length: 50 }).map((_, i) => {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    const name = `${fn} ${ln}`;
    const company = Math.random() < 0.85 ? pick(companies) : null;
    const status = pick([...statuses]);
    const email = `${slugify(fn)}.${slugify(ln)}${i}@example.com`;
    const notes = Math.random() < 0.75 ? pick(noteSnippets) : null;
    const createdAt = new Date(now - randInt(0, 1000 * 60 * 60 * 24 * 60));

    return { name, email, company, status, notes, createdAt };
  });

  const createdCustomers = await Promise.all(
    customersToCreate.map((c) =>
      db.customer.create({
        data: {
          name: c.name,
          email: c.email,
          company: c.company ?? undefined,
          status: c.status,
          notes: c.notes ?? undefined,
          createdAt: c.createdAt,
        },
      }),
    ),
  );

  const activitiesToCreate = createdCustomers.flatMap((customer) => {
    const count = randInt(1, 5);
    return Array.from({ length: count }).map(() => {
      const type = pick([...activityTypes]);
      const content = pick([...activityTemplates[type]]);
      const occurredAt = new Date(
        Date.now() - randInt(0, 1000 * 60 * 60 * 24 * 45),
      );
      return {
        customerId: customer.id,
        type,
        content,
        occurredAt,
      };
    });
  });

  await db.activity.createMany({ data: activitiesToCreate });

  return NextResponse.json({
    ok: true,
    createdCustomers: createdCustomers.length,
    createdActivities: activitiesToCreate.length,
  });
}

