import { FileText, LayoutDashboard, LifeBuoy } from "lucide-react";

export const exhibitorPortalLinks = [
  { href: "/exhibitor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exhibitor-registration-questions.pdf", label: "Registration guide", icon: FileText, external: true },
  { href: "/contact", label: "Support", icon: LifeBuoy },
] as const;
