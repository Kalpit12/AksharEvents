import { Suspense } from "react";
import type { Metadata } from "next";
import ExhibitorAuthForm from "./exhibitor-auth-form";

export const metadata: Metadata = {
  title: "Exhibitor Portal",
  description: "Sign in or create an exhibitor account on AksharEvents.",
};

export default function ExhibitorAuthPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center px-4 py-12">Loading...</div>}>
      <ExhibitorAuthForm />
    </Suspense>
  );
}
