import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booth visitor scan",
  robots: { index: false, follow: false },
};

export default function BoothLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
