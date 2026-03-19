import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../src/lib/auth";
import { db } from "../../../../src/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId") || undefined;
  const take = Math.min(100, Math.max(1, Number(searchParams.get("take") ?? 20)));

  if (customerId && auth.role !== "ADMIN") {
    const c = await db.customer.findUnique({
      where: { id: customerId },
      select: { ownerId: true },
    });
    if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (c.ownerId !== auth.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await db.emailLog.findMany({
    where:
      auth.role === "ADMIN"
        ? { customerId }
        : { customerId, customer: { ownerId: auth.id } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      customerId: true,
      toEmail: true,
      fromEmail: true,
      subject: true,
      status: true,
      error: true,
      provider: true,
      providerMessageId: true,
      createdAt: true,
      sentAt: true,
      createdByUserId: true,
      customer: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ items: logs });
}

