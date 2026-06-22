import Link from "next/link";
import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";

const variants = {
  primary: "bg-primary text-primary-foreground hover:bg-champagne-dark shadow-md shadow-espresso/10",
  secondary: "bg-espresso text-alabaster hover:bg-espresso/90 shadow-md shadow-espresso/10",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
};

export default function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
