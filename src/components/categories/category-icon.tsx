import {
  Briefcase,
  Clapperboard,
  Cpu,
  Factory,
  GraduationCap,
  HeartPulse,
  Landmark,
  Target,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  technology: Cpu,
  business: Briefcase,
  education: GraduationCap,
  careers: Target,
  healthcare: HeartPulse,
  agriculture: Wheat,
  government: Landmark,
  manufacturing: Factory,
  entertainment: Clapperboard,
};

const sizeClasses = {
  sm: { box: "h-10 w-10 rounded-lg", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 rounded-xl", icon: "h-6 w-6" },
  lg: { box: "h-14 w-14 rounded-2xl", icon: "h-7 w-7" },
} as const;

interface CategoryIconProps {
  slug: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function CategoryIcon({ slug, size = "md", className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[slug] ?? Briefcase;
  const s = sizeClasses[size];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-champagne/25 bg-champagne/10 text-champagne-dark transition-all duration-300",
        "group-hover:border-champagne/50 group-hover:bg-champagne/20 group-hover:shadow-sm",
        s.box,
        className
      )}
      aria-hidden="true"
    >
      <Icon className={s.icon} strokeWidth={1.75} />
    </div>
  );
}
