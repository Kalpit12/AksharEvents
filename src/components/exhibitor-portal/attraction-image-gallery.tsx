"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AttractionImage } from "@/lib/kenya-attractions";
import { cn } from "@/lib/utils";

const SLIDE_INTERVAL_MS = 4500;

export function AttractionImageGallery({ images, name }: { images: AttractionImage[]; name: string }) {
  const imageCount = images.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);

  pausedRef.current = paused;

  const goTo = useCallback(
    (index: number) => {
      if (imageCount === 0) return;
      setActiveIndex(((index % imageCount) + imageCount) % imageCount);
    },
    [imageCount]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [imageCount]);

  useEffect(() => {
    if (imageCount <= 1) return;

    const timer = window.setInterval(() => {
      if (pausedRef.current) return;
      setActiveIndex((current) => (current + 1) % imageCount);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [imageCount]);

  if (imageCount === 0) return null;

  const active = images[activeIndex] ?? images[0]!;

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-md"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Image
          key={`${name}-${active.url}`}
          src={active.url}
          alt={active.alt}
          fill
          className="attraction-slide-image object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={activeIndex === 0}
        />

        {imageCount > 1 && (
          <>
            <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => goTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    index === activeIndex ? "w-5 bg-alabaster" : "w-1.5 bg-alabaster/50 hover:bg-alabaster/80"
                  )}
                  aria-label={`Show ${name} photo ${index + 1}`}
                  aria-current={index === activeIndex}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              Showing image {activeIndex + 1} of {imageCount}: {active.alt}
            </p>
          </>
        )}
      </div>

      {imageCount > 1 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-all",
                index === activeIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border/60 opacity-80 hover:opacity-100"
              )}
              aria-label={`View ${name} photo ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <Image src={image.url} alt="" fill className="object-cover" sizes="120px" aria-hidden />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
