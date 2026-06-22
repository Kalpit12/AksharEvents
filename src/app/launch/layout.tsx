import type { Metadata } from "next";
import { BRAND } from "@/lib/utils";

export const metadata: Metadata = {
  title: `Launch | ${BRAND.name}`,
  description: `${BRAND.tagline} — Kenya's premier event discovery and booking platform is here.`,
};

export default function LaunchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
