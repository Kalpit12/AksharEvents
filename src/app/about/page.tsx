import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${BRAND.name} — Kenya's premier event discovery and booking platform.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">About {BRAND.name}</h1>

      <div className="prose dark:prose-invert max-w-none space-y-6 text-muted-foreground">
        <p className="text-lg">
          <strong>{BRAND.name}</strong> is Kenya&apos;s premier event discovery and booking platform,
          connecting attendees with career fairs, university events, conferences, expos, and networking
          opportunities across Africa.
        </p>

        <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
        <p>
          To democratize access to events across Kenya and Africa by providing a modern, scalable platform
          where organizers can create world-class events and attendees can discover, book, and experience
          them seamlessly.
        </p>

        <h2 className="text-xl font-bold text-foreground">What We Offer</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Career fairs and recruitment expos connecting employers with talent</li>
          <li>University and academic events for students and educators</li>
          <li>Industry conferences and technology summits</li>
          <li>Corporate networking and business events</li>
          <li>Community workshops and training programs</li>
          <li>Healthcare, agriculture, and government sector events</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground">Why AksharEvents?</h2>
        <p>
          Unlike traditional event platforms, we focus on the unique needs of the African market — from
          M-Pesa-ready payments to mobile-first design, QR ticket verification, and AI-powered event
          recommendations tailored to your interests.
        </p>

        <p className="text-primary font-semibold text-lg">{BRAND.tagline}</p>
      </div>
    </div>
  );
}
