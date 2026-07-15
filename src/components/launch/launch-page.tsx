"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { subscribeNewsletter } from "@/lib/actions";
import { BRAND } from "@/lib/utils";
import { toast } from "sonner";
import {
  ArrowRight,
  Calendar,
  Ticket,
  Users,
  Sparkles,
  MapPin,
  QrCode,
  TrendingUp,
  Building2,
  GraduationCap,
  Briefcase,
  Mic2,
  ChevronDown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const stats = [
  { value: "500+", label: "Events Yearly" },
  { value: "50K+", label: "Attendees" },
  { value: "200+", label: "Organizers" },
  { value: "15+", label: "Cities" },
];

const features = [
  {
    icon: Calendar,
    title: "Discover Events",
    description: "Career fairs, conferences, expos, and university events across Kenya and Africa.",
    color: "from-champagne to-champagne-dark",
  },
  {
    icon: Ticket,
    title: "Instant Booking",
    description: "Free and paid tickets with Stripe checkout, coupons, and QR code delivery.",
    color: "from-champagne to-champagne-dark",
  },
  {
    icon: QrCode,
    title: "Smart Check-in",
    description: "Organizers scan QR tickets at the door — no duplicates, no hassle.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: TrendingUp,
    title: "Organizer Tools",
    description: "Analytics, exhibitor management, sponsor tiers, and real-time reports.",
    color: "from-cyan-500 to-champagne",
  },
];

const eventTypes = [
  { icon: Briefcase, label: "Career Fairs", emoji: "🎯" },
  { icon: GraduationCap, label: "University Events", emoji: "🎓" },
  { icon: Mic2, label: "Conferences", emoji: "🎤" },
  { icon: Building2, label: "Expos", emoji: "🏢" },
  { icon: Users, label: "Networking", emoji: "🤝" },
  { icon: Sparkles, label: "Workshops", emoji: "✨" },
];

function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

function AnimatedCounter({ value }: { value: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 100 }}
      className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-champagne-light to-champagne bg-clip-text text-transparent"
    >
      {value}
    </motion.span>
  );
}

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12 }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl hover:border-champagne/30 hover:bg-white/10 transition-colors"
    >
      <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg mb-6`}>
        <feature.icon className="h-7 w-7 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-champagne/0 to-champagne/0 group-hover:from-champagne/5 group-hover:to-transparent transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}

export default function LaunchPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  useEffect(() => setMounted(true), []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await subscribeNewsletter(email);
    setLoading(false);
    if (result.error) toast.error(result.error);
    else {
      toast.success("You're on the list!");
      setEmail("");
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.25),transparent)]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.03%22/%3E%3C/svg%3E')] opacity-50" />
        <FloatingOrb className="w-96 h-96 bg-champagne top-20 -left-48" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-champagne-dark top-1/3 right-0" delay={2} />
        <FloatingOrb className="w-72 h-72 bg-amber-500 bottom-20 left-1/4" delay={4} />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#030712]/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/launch" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-champagne to-champagne-dark font-bold text-lg shadow-lg shadow-champagne/25">
              A
            </div>
            <span className="font-bold text-lg tracking-tight">{BRAND.name}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-alabaster/80 hover:text-white hover:bg-white/10 hidden sm:flex" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
            <Button className="bg-gradient-to-r from-champagne to-champagne-dark hover:from-champagne-light hover:to-champagne shadow-lg shadow-champagne/20 border-0" asChild>
              <Link href="/">
                Enter Platform
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16"
      >
        <div className="mx-auto max-w-5xl text-center">
          <AnimatePresence>
            {mounted && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-4 py-1.5 text-sm text-champagne-light mb-8"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-champagne-light opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-champagne" />
                  </span>
                  Now Live Across Kenya & Africa
                </motion.div>

                <motion.h1
                  custom={0}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05]"
                >
                  <span className="block text-white">The Future of</span>
                  <span className="block mt-2 bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark bg-clip-text text-transparent">
                    Event Experiences
                  </span>
                </motion.h1>

                <motion.p
                  custom={1}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mt-8 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                  {BRAND.tagline} — Discover career fairs, university events, conferences, and expos. Book tickets instantly. Experience events like never before.
                </motion.p>

                <motion.div
                  custom={2}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                  <Button
                    size="lg"
                    className="h-14 px-8 text-base bg-gradient-to-r from-champagne to-champagne-dark hover:from-champagne-light hover:to-champagne shadow-xl shadow-champagne/25 border-0 rounded-2xl"
                    asChild
                  >
                    <Link href="/events">
                      Explore Events
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href="/auth/exhibitor">Exhibitor Portal</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 px-8 text-base rounded-2xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href="/auth/login">Event Master</Link>
                  </Button>
                </motion.div>

                <motion.div
                  custom={3}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-champagne" />
                    Nairobi
                  </span>
                  <span className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-champagne" />
                    Free & Paid Tickets
                  </span>
                  <span className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-champagne" />
                    QR Check-in
                  </span>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </motion.div>
      </motion.section>

      {/* Stats */}
      <section className="relative py-24 border-y border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <AnimatedCounter value={stat.value} />
                <p className="mt-2 text-muted-foreground text-sm uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Event types marquee */}
      <section className="relative py-16 overflow-hidden">
        <motion.div
          animate={{ x: [0, -1200] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-6 whitespace-nowrap"
        >
          {[...eventTypes, ...eventTypes, ...eventTypes].map((type, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm"
            >
              <span className="text-2xl">{type.emoji}</span>
              <span className="font-medium text-alabaster/70">{type.label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative py-32 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-champagne-light to-champagne bg-clip-text text-transparent">
                host & attend
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Built for organizers, exhibitors, sponsors, and attendees across Africa.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Showcase visual */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-3xl border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-champagne/20 via-transparent to-champagne/10" />
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 sm:p-14 flex flex-col justify-center">
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  From career fairs to tech summits
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  AxarEvents focuses on what matters in Kenya and Africa — recruitment expos, university open days, corporate networking, industry conferences, and community workshops.
                </p>
                <ul className="space-y-3">
                  {["AI-powered event recommendations", "Multi-tier sponsor & exhibitor modules", "Real-time attendance analytics"].map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-3 text-alabaster/80"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-champagne" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[320px] lg:min-h-[400px] bg-gradient-to-br from-espresso/50 to-espresso p-8 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity }}
                  className="relative w-full max-w-sm"
                >
                  <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-champagne to-champagne-dark flex items-center justify-center font-bold">A</div>
                      <div>
                        <p className="font-semibold text-sm">Your next event</p>
                        <p className="text-xs text-muted-foreground">Discover · Book · Attend</p>
                      </div>
                    </div>
                    <div className="h-32 rounded-xl bg-gradient-to-br from-champagne/40 to-champagne-dark/40 mb-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-champagne-light font-bold">Browse events</span>
                      <span className="text-xs text-muted-foreground bg-white/10 px-3 py-1 rounded-full">AxarEvents</span>
                    </div>
                  </div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -top-4 -right-4 rounded-xl border border-amber-500/30 bg-amber-500/20 backdrop-blur px-4 py-2 text-sm font-medium text-amber-200"
                  >
                    🔥 Trending
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA / Newsletter */}
      <section className="relative py-32 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to experience{" "}
            <span className="bg-gradient-to-r from-champagne-light to-champagne bg-clip-text text-transparent">
              {BRAND.name}
            </span>
            ?
          </h2>
          <p className="text-muted-foreground mb-10">
            Join thousands discovering and booking events across Africa.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground rounded-xl"
            />
            <Button
              type="submit"
              disabled={loading}
              className="h-12 px-6 bg-gradient-to-r from-champagne to-champagne-dark rounded-xl border-0 shadow-lg shadow-champagne/20"
            >
              {loading ? "..." : "Get Updates"}
            </Button>
          </form>

          <Button
            size="lg"
            className="h-14 px-10 text-base bg-alabaster text-espresso hover:bg-cashmere rounded-2xl font-semibold"
            asChild
          >
            <Link href="/">
              Launch {BRAND.name}
              <Sparkles className="h-5 w-5 text-amber-500" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Designed by Maxpro Infotech Ltd</p>
          <p>Powered by AksharEvents {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
