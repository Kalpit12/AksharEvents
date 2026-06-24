"use client";

import { usePathname } from "next/navigation";

export function LayoutShellClient({
  children,
  header,
  exhibitorHeader,
  footer,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  exhibitorHeader: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/launch") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/exhibitor")) {
    return (
      <>
        {exhibitorHeader}
        <main className="flex-1 overflow-x-hidden bg-muted/20">{children}</main>
      </>
    );
  }

  return (
    <>
      {header}
      <main className="flex-1 overflow-x-hidden">{children}</main>
      {footer}
    </>
  );
}
