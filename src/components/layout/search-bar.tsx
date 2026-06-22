"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    events: { id: string; title: string; slug: string; banner: string | null }[];
    organizers: { id: string; name: string | null; image: string | null }[];
    venues: { id: string; name: string; slug: string; city: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/events?search=${encodeURIComponent(query)}`);
      setOpen(false);
    }
  };

  const hasResults = results && (
    results.events.length > 0 || results.organizers.length > 0 || results.venues.length > 0
  );

  return (
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="Search events, venues, organizers..."
          className="pl-9 pr-9 bg-muted border-0"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground/70" />
        )}
      </form>

      {open && hasResults && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border bg-card shadow-xl z-50 max-h-96 overflow-y-auto">
          {results.events.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Events</p>
              {results.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted"
                >
                  <div className="relative h-10 w-14 rounded overflow-hidden shrink-0">
                    <SafeImage src={event.banner} alt={event.title} fill />
                  </div>
                  <span className="text-sm font-medium truncate">{event.title}</span>
                </Link>
              ))}
            </div>
          )}
          {results.venues.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Venues</p>
              {results.venues.map((venue) => (
                <Link
                  key={venue.id}
                  href={`/venues/${venue.slug}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg p-2 hover:bg-muted"
                >
                  <span className="text-sm font-medium">{venue.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{venue.city}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
