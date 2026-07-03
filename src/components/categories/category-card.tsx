import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/categories/category-icon";
import { CATEGORY_IMAGES } from "@/lib/category-images";

interface CategoryCardProps {
  name: string;
  slug: string;
}

export function CategoryCard({ name, slug }: CategoryCardProps) {
  const image = CATEGORY_IMAGES[slug];
  const href = `/events?category=${slug}`;
  const description = `Browse ${name.toLowerCase()} events across Kenya and Africa`;

  if (!image) {
    return (
      <Link
        href={href}
        className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-champagne hover:shadow-lg sm:p-8"
      >
        <CategoryIcon slug={slug} size="lg" />
        <h2 className="mt-4 text-xl font-bold transition-colors group-hover:text-primary">{name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group relative block h-full min-h-[220px] w-full overflow-hidden rounded-2xl border border-border transition-all hover:border-champagne hover:shadow-lg sm:min-h-[260px]"
    >
      <Image
        src={image}
        alt=""
        fill
        className="object-cover grayscale transition-all duration-500 group-hover:scale-105 group-hover:grayscale-0"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25 transition-colors duration-500 group-hover:from-black/65 group-hover:via-black/35 group-hover:to-black/15" />
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-white">{name}</h2>
        <p className="mt-2 text-sm text-white/85">{description}</p>
      </div>
    </Link>
  );
}
