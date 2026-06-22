"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Search, ArrowRight } from "lucide-react";

interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  href: string;
  cta: string;
}

export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current] || slides[0];

  return (
    <section className="relative h-[58vh] min-h-[360px] max-h-[700px] overflow-hidden bg-espresso sm:min-h-[450px] lg:min-h-[500px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.image}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/85 via-espresso/55 to-espresso/25" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl"
        >
          <p className="text-champagne-light font-medium mb-3 tracking-wide uppercase text-sm">
            Discover. Book. Experience.
          </p>
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl">
            {slide.title}
          </h1>
          <p className="mt-4 text-lg text-alabaster/80 max-w-lg">{slide.subtitle}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href={slide.href}>
                {slide.cta}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
              <Link href="/events">
                <Search className="h-5 w-5" />
                Explore All Events
              </Link>
            </Button>
          </div>
        </motion.div>

        {slides.length > 1 && (
          <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? "w-8 bg-primary" : "w-2 bg-white/50"
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
