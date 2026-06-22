import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { LayoutShell } from "@/components/layout/layout-shell";
import { BRAND } from "@/lib/utils";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5001"),
  title: {
    default: `${BRAND.name} | ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Kenya's premier event discovery and booking platform. Find career fairs, university events, conferences, expos, and networking events across Africa.",
  keywords: ["events", "Kenya", "Africa", "career fair", "conference", "expo", "booking", "tickets"],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: BRAND.name,
    title: BRAND.name,
    description: BRAND.tagline,
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} h-full`}>
      <body className="min-h-full flex flex-col overflow-x-hidden font-sans antialiased bg-background text-foreground">
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
