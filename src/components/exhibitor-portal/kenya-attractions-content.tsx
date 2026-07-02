"use client";

import { AttractionImageGallery } from "@/components/exhibitor-portal/attraction-image-gallery";
import Ferrofluid from "@/components/ferrofluid/Ferrofluid";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { KENYA_ATTRACTIONS, KENYA_ATTRACTIONS_INTRO } from "@/lib/kenya-attractions";
import { BRAND } from "@/lib/utils";
import { ArrowLeft, Compass, MapPin } from "lucide-react";

export function KenyaAttractionsContent() {
  return (
    <div className="space-y-10 pb-8">
      <div className="relative overflow-hidden rounded-2xl border border-champagne/30 bg-espresso shadow-lg">
        <Ferrofluid
          colors={["#1C1A17", "#C5A880", "#EFECE6"]}
          speed={0.5}
          scale={1.6}
          turbulence={1}
          fluidity={0.1}
          rimWidth={0.2}
          sharpness={2.5}
          shimmer={1.5}
          glow={2}
          flowDirection="down"
          opacity={1}
          mouseInteraction
          mouseStrength={1}
          mouseRadius={0.35}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-espresso/75 via-espresso/55 to-champagne-dark/40" />

        <div className="relative z-10 flex justify-end px-5 pt-5 sm:px-7 sm:pt-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-champagne-light hover:bg-alabaster/10 hover:text-alabaster"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>

        <div className="relative z-10 px-5 pb-10 pt-2 text-alabaster sm:px-7 sm:pb-12">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-alabaster/15 px-3 py-1 text-xs font-medium text-champagne-light">
              <Compass className="h-3.5 w-3.5 shrink-0" />
              {KENYA_ATTRACTIONS_INTRO.subtitle}
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{KENYA_ATTRACTIONS_INTRO.title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-champagne-light/90 sm:text-base">
              {KENYA_ATTRACTIONS_INTRO.overview}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-16 sm:space-y-20">
        {KENYA_ATTRACTIONS.map((place, index) => {
          const imageFirst = index % 2 === 0;

          return (
            <article
              key={place.slug}
              className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
            >
              <div className={imageFirst ? "order-1" : "order-1 lg:order-2"}>
                <AttractionImageGallery images={place.images} name={place.name} priority={index === 0} />
              </div>

              <div className={imageFirst ? "order-2" : "order-2 lg:order-1"}>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                  {place.tagline}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{place.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{place.description}</p>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {place.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-foreground sm:text-sm"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 text-center sm:px-10">
        <h2 className="text-lg font-semibold text-foreground">Exhibiting in Kenya?</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          Sign in to the {BRAND.name} exhibitor portal to request shuttles, safaris, and coordinated trips for your team while you are here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/events">Browse events</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-champagne-dark">
            <Link href="/auth/exhibitor">Exhibitor portal</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
