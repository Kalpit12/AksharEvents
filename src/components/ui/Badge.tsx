import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "accent" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-champagne/20 text-espresso dark:bg-champagne/15 dark:text-champagne-light",
    secondary: "bg-cashmere text-espresso dark:bg-muted dark:text-alabaster",
    accent: "bg-champagne text-primary-foreground",
    outline: "border border-border text-foreground",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-orange-100 text-orange-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
