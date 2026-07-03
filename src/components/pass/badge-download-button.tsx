"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  bookingNumber: string;
  variant?: "default" | "outline";
  className?: string;
};

export function BadgeDownloadButton({
  bookingNumber,
  variant = "default",
  className,
}: Props) {
  const href = `/api/pass/${encodeURIComponent(bookingNumber)}/badge`;

  return (
    <Button asChild variant={variant} className={className}>
      <a href={href} download={`aksharevents-badge-${bookingNumber}.pdf`}>
        <Download className="h-4 w-4" />
        Download badge
      </a>
    </Button>
  );
}
