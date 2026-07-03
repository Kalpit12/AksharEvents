"use client";

import { AlertTriangle, Check, Info, X } from "lucide-react";
import { Toaster } from "sonner";

export function AksharToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton
      expand={false}
      visibleToasts={4}
      offset={72}
      mobileOffset={64}
      icons={{
        success: <Check className="akshar-toast__glyph" strokeWidth={3} aria-hidden />,
        error: <X className="akshar-toast__glyph" strokeWidth={3} aria-hidden />,
        info: <Info className="akshar-toast__glyph" strokeWidth={2.5} aria-hidden />,
        warning: <AlertTriangle className="akshar-toast__glyph" strokeWidth={2.5} aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "akshar-toast",
          title: "akshar-toast__title",
          description: "akshar-toast__description",
          closeButton: "akshar-toast__close",
          icon: "akshar-toast__icon",
          content: "akshar-toast__content",
          success: "akshar-toast--success",
          error: "akshar-toast--error",
          info: "akshar-toast--info",
          warning: "akshar-toast--warning",
        },
      }}
    />
  );
}
