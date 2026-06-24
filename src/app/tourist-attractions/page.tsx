import { KenyaAttractionsContent } from "@/components/exhibitor-portal/kenya-attractions-content";
import { BRAND } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tourist Attractions in Kenya",
  description: `Discover safari parks, coastlines, and cultural sites to visit in Kenya — curated by ${BRAND.name}.`,
};

export default function TouristAttractionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <KenyaAttractionsContent />
    </div>
  );
}
