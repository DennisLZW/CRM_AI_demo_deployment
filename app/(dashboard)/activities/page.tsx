import Link from "next/link";
import { requireSession } from "../../../src/lib/auth";
import { db } from "../../../src/lib/db";
import { listRecentActivities } from "../../../src/services/activity-service";

export default async function ActivitiesPage() {
  const session = await requireSession();
  const limit = 50;

  const activities =
    session?.user?.role === "ADMIN"
      ? await listRecentActivities(limit)
      : await db.activity.findMany({
          orderBy: { occurredAt: "desc" },
          take: limit,
          where: { customer: { ownerId: session?.user?.id } },
          include: {
            customer: {
              select: { id: true, name: true, company: true },
            },
          },
        });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activities</h1>
        <p className="text-sm text-muted-foreground">
          Timeline of the last 50 activities across customers. Click a customer to open details.
        </p>
      </div>

      <div className="space-y-3 rounded-md border border-border bg-card p-4 text-sm">
        {activities.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No activities yet. Add one on the customer details page first.
          </div>
        ) : (
          <ul className="space-y-3">
            {activities.map((a: any) => (
              <li
                key={a.id}
                className="rounded-md border border-border/60 bg-background px-3 py-2"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {a.type}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <Link
                      href={`/customers/${a.customer?.id ?? a.customerId}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {a.customer?.name ?? "Unknown customer"}
                    </Link>
                    {a.customer?.company ? (
                      <span className="text-xs text-muted-foreground">
                        ({a.customer.company})
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.occurredAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{a.content}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

