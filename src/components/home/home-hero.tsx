"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Search, ArrowRight, Play } from "lucide-react";

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  cta: string;
}

const SLIDE_DURATION_MS = 5000;

export function HomeHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressStartRef = useRef(Date.now());
  const progressAtPauseRef = useRef(0);
  const progressRef = useRef(0);

  const slideCount = slides.length;
  const slide = slides[current] ?? slides[0];

  const goTo = useCallback(
    (index: number) => {
      if (slideCount === 0) return;
      const next = ((index % slideCount) + slideCount) % slideCount;
      setCurrent(next);
      progressRef.current = 0;
      progressStartRef.current = Date.now();
      progressAtPauseRef.current = 0;
    },
    [slideCount]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);

  useEffect(() => {
    if (slideCount <= 1 || paused) return;

    progressStartRef.current = Date.now() - (progressAtPauseRef.current / 100) * SLIDE_DURATION_MS;

    const tick = window.setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      const pct = Math.min(100, (elapsed / SLIDE_DURATION_MS) * 100);
      progressRef.current = pct;
      if (pct >= 100) {
        goNext();
      }
    }, 50);

    return () => window.clearInterval(tick);
  }, [current, slideCount, paused, goNext]);

  useEffect(() => {
    if (paused) {
      progressAtPauseRef.current = progressRef.current;
      return;
    }
    progressStartRef.current = Date.now() - (progressAtPauseRef.current / 100) * SLIDE_DURATION_MS;
  }, [paused]);

  useEffect(() => {
    const firstImage = slides[0]?.image;
    if (!firstImage) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = firstImage;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [slides]);

  if (!slide) return null;

  return (
    <section
      className="group/hero relative h-[72vh] min-h-[420px] max-h-[820px] overflow-hidden bg-espresso sm:min-h-[480px] lg:min-h-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {/* Background slides — Netflix-style crossfade + Ken Burns */}
      <div className="absolute inset-0">
        {slides.map((item, index) => {
          const isActive = index === current;
          return (
            <motion.div
              key={item.id}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0 }}
              transition={{ duration: 1.1, ease: "easeInOut" }}
              className="absolute inset-0"
              aria-hidden={!isActive}
            >
              <motion.div
                initial={false}
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: SLIDE_DURATION_MS / 1000, ease: "linear" }}
                className="absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={index === 0 ? "eager" : "lazy"}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  decoding="async"
                />
              </motion.div>
            </motion.div>
          );
        })}
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-espresso/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/45 to-transparent" />
      </div>

      {/* Content — bottom-left like Netflix */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl"
          >
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-champagne-light">
              Discover. Book. Experience.
            </p>
            <h1 className="text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl xl:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-3 max-w-xl text-base text-alabaster/85 sm:mt-4 sm:text-lg">
              {slide.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
              <Button size="lg" className="gap-2 shadow-lg" asChild>
                <Link href={slide.href}>
                  <Play className="h-5 w-5 fill-current" />
                  {slide.cta}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                asChild
              >
                <Link href="/events">
                  <Search className="h-5 w-5" />
                  Explore All Events
                </Link>
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
