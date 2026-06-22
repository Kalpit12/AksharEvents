"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, X } from "lucide-react";
import { EVENT_FORMATS } from "@/lib/utils";

interface EventsFiltersProps {
  categories: { id: string; name: string; slug: string }[];
}

export function EventsFilters({ categories }: EventsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/events?${params.toString()}`);
  };

  const clearAll = () => router.push("/events");

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Search events..."
            defaultValue={searchParams.get("search") || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParam("search", (e.target as HTMLInputElement).value);
            }}
            className="pl-9"
          />
        </div>

        <select
          defaultValue={searchParams.get("category") || ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("format") || ""}
          onChange={(e) => updateParam("format", e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="">All Formats</option>
          {EVENT_FORMATS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>

        <select
          defaultValue={searchParams.get("sort") || "upcoming"}
          onChange={(e) => updateParam("sort", e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm"
        >
          <option value="upcoming">Upcoming</option>
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="mt-3">
          <X className="h-4 w-4" /> Clear Filters
        </Button>
      )}
    </div>
  );
}
