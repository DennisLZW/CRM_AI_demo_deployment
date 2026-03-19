import { db } from "../lib/db";

export async function listActivitiesByCustomer(customerId: string) {
  return db.activity.findMany({
    where: { customerId },
    orderBy: { occurredAt: "desc" },
  });
}

export async function listRecentActivities(limit = 50) {
  return db.activity.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
    },
  });
}

export async function createActivity(input: {
  customerId: string;
  type: string;
  content: string;
  occurredAt?: Date;
}) {
  return db.activity.create({
    data: {
      customerId: input.customerId,
      type: input.type,
      content: input.content,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

