import { NextRequest, NextResponse } from "next/server";
import {
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../../../src/services/customer-service";
import { requireAuth } from "../../../../src/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(_req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = auth.role === "ADMIN";

  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer || (!isAdmin && customer.ownerId !== auth.id)) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = auth.role === "ADMIN";

  const { id } = await params;
  const existing = await getCustomer(id);
  if (!existing || (!isAdmin && existing.ownerId !== auth.id)) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = await req.json();
  const customer = await updateCustomer(id, {
    name: body.name,
    email: body.email ?? null,
    company: body.company ?? null,
    status: body.status,
    notes: body.notes ?? null,
  });
  return NextResponse.json(customer);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth(_req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isAdmin = auth.role === "ADMIN";

  const { id } = await params;
  const existing = await getCustomer(id);
  if (!existing || (!isAdmin && existing.ownerId !== auth.id)) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  await deleteCustomer(id);
  return NextResponse.json({ ok: true });
}

