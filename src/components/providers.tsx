"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
        <Toaster
          position="top-right"
          closeButton
          expand={false}
          visibleToasts={4}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "akshar-toast",
              title: "akshar-toast__title",
              description: "akshar-toast__description",
              closeButton: "akshar-toast__close",
              success: "akshar-toast--success",
              error: "akshar-toast--error",
              info: "akshar-toast--info",
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
