import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Clock, ScanLine, Users } from "lucide-react";

export function CheckInStatusBadge({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Checked in</Badge>;
  }

  return <Badge variant="outline">Pending</Badge>;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  tone: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50"
        : "border-border bg-card";

  const DefaultIcon = tone === "success" ? CheckCircle2 : tone === "warning" ? Clock : Users;
  const IconComponent = Icon ?? DefaultIcon;

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export const CHECKIN_SCANNER_ICON = ScanLine;
