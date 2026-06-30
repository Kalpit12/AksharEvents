import Header from "@/components/layout/Header";
import ExhibitorHeader from "@/components/layout/exhibitor-header";
import AdminHeader from "@/components/layout/admin-header";
import PrintingHeader from "@/components/layout/printing-header";
import Footer from "@/components/layout/Footer";
import { LayoutShellClient } from "@/components/layout/layout-shell-client";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutShellClient
      header={<Header />}
      exhibitorHeader={<ExhibitorHeader />}
      adminHeader={<AdminHeader />}
      printingHeader={<PrintingHeader />}
      footer={<Footer />}
    >
      {children}
    </LayoutShellClient>
  );
}
