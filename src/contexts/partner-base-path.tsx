"use client";

import { createContext, useContext } from "react";

const PartnerBasePathContext = createContext("");

export function PartnerBasePathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return (
    <PartnerBasePathContext.Provider value={basePath}>
      {children}
    </PartnerBasePathContext.Provider>
  );
}

export function usePartnerBasePath() {
  return useContext(PartnerBasePathContext);
}

export function usePartnerHref() {
  const basePath = usePartnerBasePath();
  return (path: string) => {
    if (!basePath) return path.startsWith("/") ? path : `/${path}`;
    const normalized = path.startsWith("/") ? path : `/${path}`;
    return `${basePath}${normalized}`;
  };
}
