import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";
import { CategoryIcon } from "@/components/categories/category-icon";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Categories",
  description: "Browse events by category — technology, business, careers, healthcare, and more.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Event Categories</h1>
      <p className="text-muted-foreground mb-10">Find events that match your interests</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/events?category=${cat.slug}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-champagne hover:shadow-lg sm:p-8"
          >
            <CategoryIcon slug={cat.slug} size="lg" />
            <h2 className="text-xl font-bold mt-4 group-hover:text-primary transition-colors">{cat.name}</h2>
            <p className="text-sm text-muted-foreground mt-2">Browse {cat.name.toLowerCase()} events across Kenya and Africa</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
