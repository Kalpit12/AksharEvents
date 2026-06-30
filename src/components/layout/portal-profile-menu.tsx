"use client";

import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function PortalProfileMenu({
  name,
  email,
}: {
  name: string;
  email?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initials = getInitials(name);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="inline-flex h-9 max-w-[200px] items-center gap-2 rounded-full border border-white/20 bg-white/10 pl-1 pr-2.5 text-sm text-alabaster transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne-light/50"
        aria-label="Open profile menu"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-champagne/30 text-xs font-semibold text-alabaster">
          {initials}
        </span>
        <span className="hidden truncate font-medium sm:inline">{name}</span>
        <ChevronDown className="hidden h-4 w-4 shrink-0 opacity-70 sm:block" />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-[100] mt-2 min-w-[220px] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-champagne/20 text-sm font-semibold text-espresso">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{name}</p>
              {email ? (
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              ) : null}
            </div>
          </div>

          <div className="my-1 h-px bg-border" />

          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-foreground outline-none transition-colors hover:bg-muted focus-visible:bg-muted"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
