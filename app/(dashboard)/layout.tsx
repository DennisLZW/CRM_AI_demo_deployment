import { ReactNode } from "react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 border-r border-sidebar-border bg-sidebar p-4 md:flex md:flex-col">
        <div className="mb-6 text-lg font-semibold">SmartCRM AI</div>
        <nav className="flex flex-1 flex-col gap-2 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Dashboard
          </Link>
          <Link href="/customers" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Customers
          </Link>
          <Link href="/activities" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Activities
          </Link>
          <Link href="/emails" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Email logs
          </Link>
          <Link href="/settings" className="rounded-md px-3 py-2 hover:bg-sidebar-accent">
            Settings
          </Link>
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}

