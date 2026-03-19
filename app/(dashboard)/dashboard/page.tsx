import Link from "next/link";
import { getDashboardData } from "../../../src/services/dashboard-service";
import { requireSession } from "../../../src/lib/auth";

export default async function DashboardPage() {
  const session = await requireSession();
  const ownerId = session?.user?.role === "STAFF" ? session.user.id : undefined;

  const { stats, recentActivities, staleCustomers } = await getDashboardData({
    recentActivityLimit: 12,
    staleDays: 14,
    staleLimit: 10,
    ownerId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Key metrics, recent activities, and customers to follow up on (calculated from real data).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total customers</div>
          <div className="mt-1 text-2xl font-semibold">{stats.totalCustomers}</div>
        </div>
        <Link
          href="/dashboard/new-customers"
          className="rounded-md border border-border bg-card p-4 hover:bg-muted/30"
        >
          <div className="text-xs text-muted-foreground">New customers (last 7 days)</div>
          <div className="mt-1 text-2xl font-semibold">{stats.newCustomers7d}</div>
        </Link>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Activities (last 7 days)</div>
          <div className="mt-1 text-2xl font-semibold">{stats.activities7d}</div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Won customers (this month)</div>
          <div className="mt-1 text-2xl font-semibold">
            {stats.wonCustomersThisMonth}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Lost customers (this month)</div>
          <div className="mt-1 text-2xl font-semibold">
            {stats.lostCustomersThisMonth}
          </div>
        </div>
        <Link
          href="/dashboard/stale-customers"
          className="rounded-md border border-border bg-card p-4 hover:bg-muted/30"
        >
          <div className="text-xs text-muted-foreground">
            Follow up (no contact for {stats.staleDays} days)
          </div>
          <div className="mt-1 text-2xl font-semibold">{stats.staleCount}</div>
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-card p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">Recent activities</div>
            <Link
              href="/activities"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          {recentActivities.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No activities yet.
            </div>
          ) : (
            <ul className="space-y-2">
              {recentActivities.map((a: any) => (
                <li
                  key={a.id}
                  className="rounded-md border border-border/60 bg-background px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {a.type}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <Link
                        href={`/customers/${a.customer?.id ?? a.customerId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {a.customer?.name ?? "Unknown customer"}
                      </Link>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {new Date(a.occurredAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {a.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-border bg-card p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium">
              Customers to follow up (no contact for {stats.staleDays} days)
            </div>
            <Link
              href="/customers"
              className="text-xs text-muted-foreground hover:underline"
            >
              Open customers list
            </Link>
          </div>
          {staleCustomers.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No customers to follow up.
            </div>
          ) : (
            <ul className="space-y-2">
              {staleCustomers.map((c: any) => (
                <li
                  key={c.id}
                  className="rounded-md border border-border/60 bg-background px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/customers/${c.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {c.name}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.lastActivityAt
                        ? `Last contacted: ${new Date(
                            c.lastActivityAt,
                          ).toLocaleDateString()}`
                        : "Never contacted"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{c.company ?? "-"}</span>
                    <span>·</span>
                    <span>{c.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

