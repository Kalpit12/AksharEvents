"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { cn } from "@/lib/utils";
import type { EventFormat } from "@prisma/client";

type CarouselEvent = {
  id: string;
  title: string;
  slug: string;
  banner: string | null;
  startDate: Date | string;
  format: EventFormat;
  isFeatured?: boolean;
  category: { name: string; slug: string };
  venue: { name?: string; city: string } | null;
  ticketTypes: { price: { toNumber?: () => number } | number | string }[];
};

function getItemsPerView(width: number) {
  if (width < 640) return 1;
  if (width < 1024) return 2;
  return 4;
}

function gridColumnsClass(itemsPerView: number) {
  if (itemsPerView === 1) return "grid-cols-1";
  if (itemsPerView === 2) return "grid-cols-2";
  return "grid-cols-4";
}

export function UpcomingEventsCarousel({ events }: { events: CarouselEvent[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);

  useEffect(() => {
    const update = () => setItemsPerView(getItemsPerView(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pages = useMemo(() => {
    const chunks: CarouselEvent[][] = [];
    for (let i = 0; i < events.length; i += itemsPerView) {
      chunks.push(events.slice(i, i + itemsPerView));
    }
    return chunks;
  }, [events, itemsPerView]);

  useEffect(() => {
    setCurrentPage(0);
  }, [itemsPerView]);

  useEffect(() => {
    if (pages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentPage((p) => (p + 1) % pages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [pages.length]);

  const goTo = (index: number) => {
    setCurrentPage((index + pages.length) % pages.length);
  };

  if (events.length === 0) return null;

  const page = pages[currentPage] ?? pages[0];

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.35 }}
          className={cn("grid gap-6", gridColumnsClass(itemsPerView))}
        >
          {page.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                page.length === 1 && itemsPerView === 1 && "w-full max-w-sm sm:max-w-none"
              )}
            >
              <EventCard
                event={{ ...event, startDate: new Date(event.startDate) }}
                variant="grid"
                imagePriority={currentPage === 0 && index === 0}
              />
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {pages.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-muted sm:-left-5 sm:h-10 sm:w-10"
            aria-label="Previous events"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition-colors hover:bg-muted sm:-right-5 sm:h-10 sm:w-10"
            aria-label="Next events"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
