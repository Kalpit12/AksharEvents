"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TeamMember } from "@/components/exhibitor-portal/types";
import { cn } from "@/lib/utils";

export function MemberNameWithTooltip({
  member,
  className,
}: {
  member: Pick<TeamMember, "fn" | "ln" | "email" | "phone">;
  className?: string;
}) {
  const [tooltip, setTooltip] = useState<{ top: number; left: number } | null>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const hasContact = Boolean(member.email?.trim() || member.phone?.trim());

  const showTooltip = () => {
    if (!hasContact) return;
    const el = nameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setTooltip({ top: rect.bottom + 6, left: rect.left });
  };

  const hideTooltip = () => setTooltip(null);

  return (
    <>
      <span
        ref={nameRef}
        className={cn(
          "font-medium whitespace-nowrap",
          hasContact && "cursor-help border-b border-dotted border-muted-foreground/40",
          className
        )}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        tabIndex={hasContact ? 0 : undefined}
      >
        {member.fn} {member.ln}
      </span>
      {tooltip &&
        hasContact &&
        createPortal(
          <div
            className="pointer-events-none fixed z-[200] w-max max-w-[18rem] rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
            style={{ top: tooltip.top, left: tooltip.left }}
            role="tooltip"
          >
            {member.email?.trim() && <div className="font-medium">{member.email}</div>}
            {member.phone?.trim() && (
              <div className={cn(member.email?.trim() && "mt-0.5 text-muted-foreground")}>
                {member.phone}
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
