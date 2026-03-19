import { NextRequest, NextResponse } from "next/server";
import {
  listActivitiesByCustomer,
  listRecentActivities,
  createActivity,
} from "../../../src/services/activity-service";
import { requireAuth } from "../../../src/lib/auth";
import { db } from "../../../src/lib/db";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = auth.role === "ADMIN";

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 50;

  if (customerId) {
    if (!isAdmin) {
      const customer = await db.customer.findUnique({
        where: { id: customerId },
        select: { ownerId: true },
      });
      if (!customer || customer.ownerId !== auth.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    const activities = await listActivitiesByCustomer(customerId);
    return NextResponse.json(activities);
  }

  if (isAdmin) {
    const activities = await listRecentActivities(Number.isFinite(limit) ? limit : 50);
    return NextResponse.json(activities);
  }

  const activities = await db.activity.findMany({
    orderBy: { occurredAt: "desc" },
    take: Number.isFinite(limit) ? limit : 50,
    where: { customer: { ownerId: auth.id } },
    include: {
      customer: {
        select: { id: true, name: true, company: true },
      },
    },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = auth.role === "ADMIN";

  const body = await req.json();
  if (!body.customerId || !body.type || !body.content) {
    return NextResponse.json(
      { error: "customerId, type and content are required" },
      { status: 400 },
    );
  }

  if (!isAdmin) {
    const customer = await db.customer.findUnique({
      where: { id: body.customerId },
      select: { ownerId: true },
    });
    if (!customer || customer.ownerId !== auth.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const occurredAt = body.occurredAt ? new Date(body.occurredAt) : undefined;

  const activity = await createActivity({
    customerId: body.customerId,
    type: body.type,
    content: body.content,
    occurredAt,
  });

  return NextResponse.json(activity, { status: 201 });
}

