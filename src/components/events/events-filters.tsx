"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CustomSelect } from "@/components/exhibitor-portal/custom-select";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { EVENT_FORMATS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EventsFiltersProps {
  categories: { id: string; name: string; slug: string }[];
  basePath?: string;
}

const SORT_OPTIONS = [
  { value: "upcoming", label: "Upcoming first", triggerLabel: "Sort: Upcoming first" },
  { value: "newest", label: "Newest", triggerLabel: "Sort: Newest" },
  { value: "popular", label: "Most popular", triggerLabel: "Sort: Most popular" },
] as const;

function formatLabel(value: string) {
  return EVENT_FORMATS.find((format) => format.value === value)?.label ?? value;
}

export function EventsFilters({ categories, basePath = "/events" }: EventsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  };

  const clearAll = () => router.push(basePath);

  const categoryValue = searchParams.get("category") || "";
  const formatValue = searchParams.get("format") || "";
  const sortValue = searchParams.get("sort") || "upcoming";

  const categoryOptions = [
    { value: "", label: "All categories" },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  const formatOptions = [
    { value: "", label: "All formats" },
    ...EVENT_FORMATS.map((format) => ({
      value: format.value,
      label: format.label,
    })),
  ];

  const activeFilters = [
    searchParams.get("search")
      ? { key: "search", label: `Search: ${searchParams.get("search")}` }
      : null,
    categoryValue
      ? {
          key: "category",
          label:
            categories.find((category) => category.slug === categoryValue)?.name ??
            categoryValue,
        }
      : null,
    formatValue ? { key: "format", label: formatLabel(formatValue) } : null,
    sortValue !== "upcoming" ? { key: "sort", label: `Sort: ${sortValue}` } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  const hasFilters = activeFilters.length > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-champagne-dark" />
        Find your next event
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        <div className="relative lg:col-span-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
          <Input
            placeholder="Search by title, keyword, or tag..."
            defaultValue={searchParams.get("search") || ""}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateParam("search", (event.target as HTMLInputElement).value);
              }
            }}
            className="bg-background pl-9"
          />
        </div>

        <div className="lg:col-span-2">
          <CustomSelect
            id="events-filter-category"
            value={categoryValue}
            onChange={(value) => updateParam("category", value)}
            options={categoryOptions}
            placeholder="All categories"
            triggerClassName="h-10 border-border bg-background focus:border-champagne/50 focus:ring-champagne/20"
          />
        </div>

        <div className="lg:col-span-2">
          <CustomSelect
            id="events-filter-format"
            value={formatValue}
            onChange={(value) => updateParam("format", value)}
            options={formatOptions}
            placeholder="All formats"
            triggerClassName="h-10 border-border bg-background focus:border-champagne/50 focus:ring-champagne/20"
          />
        </div>

        <div className="lg:col-span-3">
          <CustomSelect
            id="events-filter-sort"
            value={sortValue}
            onChange={(value) => updateParam("sort", value || "upcoming")}
            options={[...SORT_OPTIONS]}
            placeholder="Sort events"
            triggerClassName="h-10 border-border bg-background focus:border-champagne/50 focus:ring-champagne/20"
          />
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <span className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Filter className="h-3.5 w-3.5" />
            Active
          </span>
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => updateParam(filter.key, "")}
              className="inline-flex items-center gap-1.5 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-champagne/20"
            >
              {filter.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAll} className="ml-auto h-8 px-2 text-xs">
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function EventsViewToggle({
  view,
  params,
}: {
  view: "grid" | "list";
  params: Record<string, string | undefined>;
}) {
  const buildHref = (nextView: "grid" | "list") => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries({ ...params, view: nextView }).filter(([, value]) => value)
      ) as Record<string, string>
    ).toString();
    return query ? `?${query}` : "?";
  };

  return (
    <div className="inline-flex rounded-lg border border-border bg-background p-1">
      {(["grid", "list"] as const).map((option) => (
        <a
          key={option}
          href={buildHref(option)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors sm:text-sm",
            view === option
              ? "bg-champagne text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option}
        </a>
      ))}
    </div>
  );
}
