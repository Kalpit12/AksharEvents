import { AboutBackground } from "@/components/about/about-background";
import { AboutPageContent } from "@/components/about/about-page-content";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${BRAND.name} — Kenya's premier event discovery, registration, and event management platform.`,
};

export default function AboutPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <AboutPageContent />
      </div>
    </div>
  );
}
