import { AboutBackground } from "@/components/about/about-background";
import { FaqComingSoon } from "@/components/faq/faq-coming-soon";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND.name} — coming soon.`,
};

export default function FAQPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />
      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <FaqComingSoon />
      </div>
    </div>
  );
}
