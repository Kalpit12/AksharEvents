import type { PartnerPublic } from "@/lib/partners";
import { getPartnerThemeStyle } from "@/lib/partners";
import { cn } from "@/lib/utils";

export function PartnerThemeWrapper({
  partner,
  children,
  className,
}: {
  partner: PartnerPublic;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("partner-site min-h-dvh", className)}
      style={getPartnerThemeStyle(partner)}
    >
      {children}
    </div>
  );
}
