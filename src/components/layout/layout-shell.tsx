import Header from "@/components/layout/Header";
import ExhibitorHeader from "@/components/layout/exhibitor-header";
import Footer from "@/components/layout/Footer";
import { LayoutShellClient } from "@/components/layout/layout-shell-client";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShellClient header={<Header />} exhibitorHeader={<ExhibitorHeader />} footer={<Footer />}>
      {children}
    </LayoutShellClient>
  );
}
