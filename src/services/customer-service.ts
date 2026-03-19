import { db } from "../lib/db";

export async function listCustomers() {
  return db.customer.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomer(id: string) {
  return db.customer.findUnique({
    where: { id },
  });
}

export async function createCustomer(input: {
  name: string;
  email?: string;
  company?: string;
  status?: string;
  notes?: string;
  ownerId?: string;
}) {
  return db.customer.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company,
      status: input.status ?? "active",
      notes: input.notes,
      ownerId: input.ownerId,
    },
  });
}

export async function updateCustomer(
  id: string,
  input: {
    name?: string;
    email?: string | null;
    company?: string | null;
    status?: string;
    notes?: string | null;
  },
) {
  return db.customer.update({
    where: { id },
    data: input,
  });
}

export async function deleteCustomer(id: string) {
  return db.customer.delete({
    where: { id },
  });
}


