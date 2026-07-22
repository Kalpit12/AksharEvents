import { AboutBackground } from "@/components/about/about-background";
import { FaqPageContent } from "@/components/faq/faq-page-content";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: `Frequently asked questions about ${BRAND.name} — visitor registration, exhibitor portal, payments, and event management.`,
};

export default function FAQPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <FaqPageContent />
      </div>
    </div>
  );
}
