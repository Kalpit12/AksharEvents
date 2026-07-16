"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-espresso text-alabaster">
      <div className="border-b border-border p-6">
        <Link href="/admin" className="text-xl font-bold">
          Axar<span className="text-champagne-light">Admin</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-lg px-4 py-3 text-sm font-medium transition-colors",
              pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href))
                ? "bg-champagne-dark text-primary-foreground"
                : "text-muted-foreground hover:bg-alabaster/10 hover:text-alabaster"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-border p-4 space-y-2">
        <Link href="/" className="block text-sm text-muted-foreground hover:text-alabaster px-4">← Back to Site</Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full text-left text-sm text-muted-foreground hover:text-alabaster px-4 py-2"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
