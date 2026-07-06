"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  EXHIBITOR_SCAN_MODE_EVENT,
  readExhibitorScanMode,
} from "@/lib/exhibitor-scan-mode";

export function LayoutShellClient({
  children,
  header,
  exhibitorHeader,
  adminHeader,
  printingHeader,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  exhibitorHeader: React.ReactNode;
  adminHeader: React.ReactNode;
  printingHeader: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const [exhibitorScanMode, setExhibitorScanMode] = useState(false);

  useEffect(() => {
    const sync = () => setExhibitorScanMode(readExhibitorScanMode());
    sync();
    window.addEventListener(EXHIBITOR_SCAN_MODE_EVENT, sync);
    return () => window.removeEventListener(EXHIBITOR_SCAN_MODE_EVENT, sync);
  }, []);

  if (pathname === "/launch" || pathname.startsWith("/booth")) {
    return <>{children}</>;
  }

  if (pathname.startsWith("/exhibitor")) {
    return (
      <>
        {!exhibitorScanMode && exhibitorHeader}
        <main className="flex-1 overflow-x-hidden bg-muted/20">{children}</main>
      </>
    );
  }

  if (pathname.startsWith("/printing")) {
    return (
      <>
        {printingHeader}
        <main className="flex-1 overflow-x-hidden bg-muted/20">{children}</main>
      </>
    );
  }

  if (pathname.startsWith("/admin")) {
    return (
      <>
        {adminHeader}
        <main className="flex-1 overflow-x-hidden bg-muted/20">{children}</main>
      </>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {header}
      <main className="min-h-0 flex-1 overflow-x-clip">{children}</main>
      <div className="shrink-0">{footer}</div>
    </div>
  );
}
