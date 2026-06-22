"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SafeImage from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";

export type SlideImage = {
  src: string;
  alt: string;
};

type ImageSliderProps = {
  images: SlideImage[];
  className?: string;
  heightClass?: string;
  autoPlayMs?: number;
  fit?: "contain" | "cover";
  /** Scale contain images to fill the frame without cropping */
  fillFrame?: boolean;
  overlay?: ReactNode;
  priority?: boolean;
};

export default function ImageSlider({
  images,
  className,
  heightClass = "h-[50vh] min-h-[400px]",
  autoPlayMs = 6000,
  fit = "contain",
  fillFrame = false,
  overlay,
  priority = false,
}: ImageSliderProps) {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length]
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!autoPlayMs || images.length <= 1) return;
    const timer = setInterval(next, autoPlayMs);
    return () => clearInterval(timer);
  }, [autoPlayMs, next, images.length]);

  if (images.length === 0) return null;

  const objectFit =
    fit === "contain"
      ? fillFrame
        ? "object-contain object-center w-full h-full max-h-full max-w-full"
        : "object-contain object-center"
      : "object-cover object-center";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-espresso",
        heightClass,
        className
      )}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={images[index].src}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={cn(
            "absolute inset-0",
            fillFrame && fit === "contain" ? "flex items-center justify-center p-2 sm:p-4" : "flex items-center justify-center"
          )}
        >
          <SafeImage
            src={images[index].src}
            alt={images[index].alt}
            fill
            priority={priority && index === 0}
            sizes="100vw"
            className={cn(objectFit, fillFrame && "min-h-0 min-w-0")}
          />
        </motion.div>
      </AnimatePresence>

      {overlay}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Previous image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white backdrop-blur-sm transition hover:bg-black/60"
            aria-label="Next image"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {images.map((img, i) => (
              <button
                key={img.src}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-8 bg-champagne" : "w-2 bg-alabaster/50 hover:bg-alabaster/80"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
