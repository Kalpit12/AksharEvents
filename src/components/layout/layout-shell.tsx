import { headers } from "next/headers";
import Header from "@/components/layout/Header";
import ExhibitorHeader from "@/components/layout/exhibitor-header";
import Footer from "@/components/layout/Footer";

export async function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLaunch = pathname === "/launch";
  const isExhibitorPortal = pathname.startsWith("/exhibitor");

  if (isLaunch) {
    return <>{children}</>;
  }

  if (isExhibitorPortal) {
    return (
      <>
        <ExhibitorHeader />
        <main className="flex-1 overflow-x-hidden bg-muted/20">{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <Footer />
    </>
  );
}
