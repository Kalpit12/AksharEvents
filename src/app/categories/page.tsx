import { CategoryCard } from "@/components/categories/category-card";
import { CATEGORIES, cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Categories",
  description: "Browse events by category — technology, business, careers, healthcare, and more.",
};

const displayedCategories = CATEGORIES.filter((cat) => cat.slug !== "entertainment");
const mainCategories = displayedCategories.slice(0, 6);
const centeredCategories = displayedCategories.slice(6);

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Event Categories</h1>
      <p className="mb-10 text-muted-foreground">Find events that match your interests</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mainCategories.map((cat) => (
          <CategoryCard key={cat.slug} name={cat.name} slug={cat.slug} />
        ))}
      </div>

      {centeredCategories.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {centeredCategories.map((cat, index) => (
            <div
              key={cat.slug}
              className={cn("h-full lg:col-span-2", index === 0 && "lg:col-start-2")}
            >
              <CategoryCard name={cat.name} slug={cat.slug} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
