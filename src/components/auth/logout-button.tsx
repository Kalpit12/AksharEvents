"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "icon";
  className?: string;
  label?: string;
  showIcon?: boolean;
};

export function LogoutButton({
  variant = "outline",
  size = "sm",
  className,
  label = "Log out",
  showIcon = true,
}: LogoutButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-1.5", className)}
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {label}
    </Button>
  );
}
