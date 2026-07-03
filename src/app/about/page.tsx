import { AboutBackground } from "@/components/about/about-background";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${BRAND.name} — Kenya's premier event discovery and booking platform.`,
};

export default function AboutPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <AboutBackground />

      <div className="relative mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
            <Sparkles className="h-3.5 w-3.5" />
            Our story
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl sm:text-4xl">About {BRAND.name}</h1>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm dark:border-champagne/15 dark:bg-card/75 sm:p-8 lg:p-10">
          <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              <strong className="text-foreground">{BRAND.name}</strong>{" "}
              is Kenya&apos;s premier event discovery and booking platform, connecting attendees with career fairs,
              university events, conferences, expos, and networking opportunities across Africa.
            </p>

            <p className="leading-relaxed">
              At Axar Events, we design and execute seamless, unforgettable experiences that leave a lasting
              impression. We specialize in bringing your
              unique vision to life through bespoke storytelling, meticulous coordination, and creative flair. We offer a
              comprehensive suite of event planning and management services, encompassing everything from high-profile
              corporate galas and innovative product launches to vibrant cultural festivals and elegant private
              celebrations. By handling every detail, from conceptual design and vendor logistics to flawless on-site
              execution, we ensure your milestones are transformed into extraordinary, stress-free realities.
            </p>

            <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
            <p>
              To democratize access to events across Kenya and Africa by providing a modern, scalable platform where
              organizers can create world-class events and attendees can discover, book, and experience them seamlessly.
            </p>

            <h2 className="text-xl font-bold text-foreground">What We Offer</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Career fairs and recruitment expos connecting employers with talent</li>
              <li>University and academic events for students and educators</li>
              <li>Industry conferences and technology summits</li>
              <li>Corporate networking and business events</li>
              <li>Community workshops and training programs</li>
            </ul>

            <h2 className="text-xl font-bold text-foreground">Why AxarEvents?</h2>
            <p>
              Unlike traditional event platforms, we focus on the unique needs of the African market, from
              M-Pesa-ready payments to mobile-first design, QR ticket verification, and AI-powered event recommendations
              tailored to your interests.
            </p>

            <p className="text-lg font-semibold text-primary">{BRAND.tagline}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
