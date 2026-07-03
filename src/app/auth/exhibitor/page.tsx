import { Suspense } from "react";
import type { Metadata } from "next";
import ExhibitorAuthForm from "./exhibitor-auth-form";
import { getOpenExhibitorEvents } from "@/lib/exhibitor-events";

export const metadata: Metadata = {
  title: "Exhibitor Portal",
  description: "Sign in or create an exhibitor account on AxarEvents.",
};

export const dynamic = "force-dynamic";

export default async function ExhibitorAuthPage() {
  const openEvents = await getOpenExhibitorEvents();

  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center px-4 py-12">Loading...</div>}>
      <ExhibitorAuthForm openEvents={openEvents} />
    </Suspense>
  );
}
