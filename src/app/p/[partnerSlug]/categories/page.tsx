import Link from "next/link";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CATEGORIES } from "@/lib/utils";
import { partnerPageMetadata, requirePartner } from "@/components/partner/partner-marketing-pages";
import { partnerPath } from "@/lib/partners";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  return partnerPageMetadata(partnerSlug, "Categories");
}

export default async function PartnerCategoriesPage({
  params,
}: {
  params: Promise<{ partnerSlug: string }>;
}) {
  const { partnerSlug } = await params;
  const partner = await requirePartner(partnerSlug);
  const base = partnerPath(partner.slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Event Categories</h1>
      <p className="mb-10 text-muted-foreground">Browse {partner.name} events by category</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.filter((c) => c.slug !== "entertainment").map((cat) => (
          <Link
            key={cat.slug}
            href={`${base}/events?category=${cat.slug}`}
            className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <CategoryIcon slug={cat.slug} size="lg" />
            <span className="text-sm font-medium">{cat.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
