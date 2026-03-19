"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Customer = {
  id: string;
  name: string;
  email?: string | null;
  company?: string | null;
  status: string;
  notes?: string | null;
  createdAt: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("active");

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editNotes, setEditNotes] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      setCustomers(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, [q, statusFilter, page, pageSize]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || undefined, company: company || undefined, status }),
    });
    setName("");
    setEmail("");
    setCompany("");
    startTransition(() => {
      setPage(1);
      void reload();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    startTransition(() => {
      const remaining = customers.length - 1;
      if (remaining === 0 && page > 1) setPage((p) => p - 1);
      void reload();
    });
  }

  function openEdit(c: Customer) {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditEmail(c.email ?? "");
    setEditCompany(c.company ?? "");
    setEditStatus(c.status);
    setEditNotes(c.notes ?? "");
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail || null,
          company: editCompany || null,
          status: editStatus,
          notes: editNotes || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Save failed: " + (err.error || res.statusText));
        return;
      }
      setEditingCustomer(null);
      startTransition(() => void reload());
    } finally {
      setEditSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
      <p className="text-sm text-muted-foreground">
        Supports creating, editing, and deleting customers. Filters and AI features can be added later.
      </p>

      <div className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-sm sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex-1 space-y-1">
            <label className="block text-xs text-muted-foreground">Search</label>
            <input
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              placeholder="Name / Email / Company / Notes"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground">Status</label>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="prospect">prospect</option>
              <option value="active">active</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <label className="block text-xs text-muted-foreground">Per page</label>
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-5 text-xs text-muted-foreground">
            {total} total · Page {page}/{totalPages}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-sm sm:flex-row sm:items-end"
      >
        <div className="flex-1 space-y-1">
          <label className="block text-xs text-muted-foreground">Name *</label>
          <input
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs text-muted-foreground">Email</label>
          <input
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="block text-xs text-muted-foreground">Company</label>
          <input
            className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs text-muted-foreground">Status</label>
          <select
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="prospect">prospect</option>
            <option value="active">active</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground hover:opacity-90 sm:mt-0"
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Create customer"}
        </button>
      </form>

      <div className="overflow-hidden rounded-md border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Notes</th>
              <th className="px-4 py-2">Created at</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                  Loading...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-muted-foreground" colSpan={7}>
                  No customers yet. Create one using the form above.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="px-4 py-2">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{c.email ?? "-"}</td>
                  <td className="px-4 py-2">{c.company ?? "-"}</td>
                  <td className="px-4 py-2">{c.status}</td>
                  <td className="px-4 py-2 max-w-xs truncate" title={c.notes ?? ""}>
                    {c.notes ?? "-"}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      className="mr-2 text-xs text-primary hover:underline"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => void handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs hover:bg-muted disabled:opacity-50"
          disabled={loading || page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="h-8 rounded-md border border-border bg-card px-3 text-xs hover:bg-muted disabled:opacity-50"
          disabled={loading || page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      <Dialog
        open={!!editingCustomer}
        onOpenChange={(open) => !open && setEditingCustomer(null)}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">Name *</label>
              <input
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">Email</label>
              <input
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                type="email"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">Company</label>
              <input
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">Status</label>
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="prospect">prospect</option>
                <option value="active">active</option>
                <option value="won">won</option>
                <option value="lost">lost</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs text-muted-foreground">Notes</label>
              <textarea
                className="min-h-15 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter showCloseButton={false}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCustomer(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


