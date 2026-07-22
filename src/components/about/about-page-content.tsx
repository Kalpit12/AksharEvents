import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Globe2,
  LayoutDashboard,
  MapPin,
  QrCode,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { BRAND } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

const offerings = [
  {
    icon: Users,
    title: "Career fairs & recruitment expos",
    description: "Connect employers with talent through large-scale hiring and networking events.",
    accent: "bg-sky-100 text-sky-700",
  },
  {
    icon: CalendarDays,
    title: "University & academic events",
    description: "Support campus fairs, graduations, and academic conferences for students and educators.",
    accent: "bg-violet-100 text-violet-700",
  },
  {
    icon: Building2,
    title: "Conferences & technology summits",
    description: "Deliver industry conferences, expos, and innovation events with professional operations.",
    accent: "bg-amber-100 text-amber-800",
  },
  {
    icon: Globe2,
    title: "Corporate & networking events",
    description: "Plan business networking, product launches, and corporate gatherings end to end.",
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: Sparkles,
    title: "Workshops & community programs",
    description: "Run training sessions, cultural festivals, and community experiences with full coordination.",
    accent: "bg-rose-100 text-rose-700",
  },
] as const;

const differentiators = [
  {
    icon: QrCode,
    title: "Digital visitor badges",
    description: "Instant registration with QR codes for smooth check-in at registration desks and booths.",
  },
  {
    icon: LayoutDashboard,
    title: "Exhibitor operations",
    description: "Booths, teams, branding, travel, and add-on services managed through the Exhibitor Portal.",
  },
  {
    icon: BadgeCheck,
    title: "Built for Africa",
    description: "Mobile-first design and workflows tailored to events across Kenya and the wider continent.",
  },
  {
    icon: MapPin,
    title: "Partner white-label sites",
    description: "Branded partner pages for organisers who want their own event presence powered by AxarEvents.",
  },
] as const;

const stats = [
  { label: "Event formats", value: "10+" },
  { label: "Visitor badge flow", value: "Instant" },
  { label: "Exhibitor portal", value: "Full ops" },
  { label: "Coverage", value: "Africa" },
] as const;

export function AboutPageContent() {
  return (
    <div className="relative">
      <section className="mb-12 text-center sm:mb-16">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-champagne-dark">
          <Sparkles className="h-3.5 w-3.5" />
          Our story
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          About {BRAND.name}
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {BRAND.name} is Kenya&apos;s premier event discovery and registration platform, connecting
          attendees with career fairs, university events, conferences, expos, and networking
          opportunities across Africa.
        </p>
        <p className="mt-4 text-sm font-semibold tracking-wide text-champagne-dark sm:text-base">
          {BRAND.tagline}
        </p>
      </section>

      <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/80 bg-card/80 px-4 py-5 text-center shadow-sm backdrop-blur-sm"
          >
            <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      <section className="mb-12 overflow-hidden rounded-2xl border border-border/80 bg-card/80 shadow-lg backdrop-blur-sm dark:border-champagne/15">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
          <div className="border-b border-border/60 bg-gradient-to-br from-champagne/15 via-champagne/5 to-transparent p-8 sm:p-10 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-wider text-champagne-dark">
              Who we are
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Experiences that leave a lasting impression
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              We combine platform technology with hands-on event planning — from concept to
              on-site execution.
            </p>
          </div>
          <div className="space-y-4 p-8 text-sm leading-relaxed text-muted-foreground sm:p-10 sm:text-base">
            <p>
              At AxarEvents, we design and execute seamless, unforgettable experiences. We
              specialize in bringing your unique vision to life through bespoke storytelling,
              meticulous coordination, and creative flair.
            </p>
            <p>
              Our comprehensive event planning and management services cover high-profile corporate
              galas, product launches, cultural festivals, and private celebrations — handling every
              detail from conceptual design and vendor logistics to flawless on-site execution.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12 rounded-2xl border border-champagne/25 bg-gradient-to-br from-champagne/15 to-transparent p-8 sm:p-10">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-champagne/20 text-champagne-dark">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Our mission</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              To democratize access to events across Kenya and Africa by providing a modern,
              scalable platform where organisers can deliver world-class events and attendees can
              discover, register, and experience them seamlessly.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What we offer</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            End-to-end event services for organisers, exhibitors, and attendees across multiple
            formats.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why {BRAND.name}?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A platform built for the African market — not a one-size-fits-all import.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {differentiators.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-champagne/15 text-champagne-dark">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-champagne/25 bg-gradient-to-br from-champagne/20 via-champagne/10 to-transparent p-8 text-center sm:p-10">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to explore?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Browse upcoming events or get in touch to plan your next expo, conference, or corporate
          gathering with AxarEvents.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-champagne text-primary-foreground hover:opacity-90">
            <Link href="/events">
              Browse events
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
