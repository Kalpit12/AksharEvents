"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

const FALLBACK = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80";

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className,
  priority,
  sizes,
}: SafeImageProps) {
  const [imageSrc, setImageSrc] = useState(src || FALLBACK);

  useEffect(() => {
    setImageSrc(src || FALLBACK);
  }, [src]);

  if (fill) {
    return (
      <Image
        src={imageSrc}
        alt={alt}
        fill
        unoptimized
        className={cn("object-cover", className)}
        priority={priority}
        sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
        onError={() => {
          if (imageSrc !== FALLBACK) setImageSrc(FALLBACK);
        }}
      />
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width || 400}
      height={height || 300}
      unoptimized
      className={cn("object-cover", className)}
      priority={priority}
      sizes={sizes}
      onError={() => {
        if (imageSrc !== FALLBACK) setImageSrc(FALLBACK);
      }}
    />
  );
}

export default SafeImage;
