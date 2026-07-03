"use client";

import { AlertTriangle, Check, Info, X } from "lucide-react";
import { Toaster } from "sonner";

export function AxarToaster() {
  return (
    <Toaster
      position="top-right"
      closeButton
      expand={false}
      visibleToasts={4}
      offset={72}
      mobileOffset={64}
      icons={{
        success: <Check className="axar-toast__glyph" strokeWidth={3} aria-hidden />,
        error: <X className="axar-toast__glyph" strokeWidth={3} aria-hidden />,
        info: <Info className="axar-toast__glyph" strokeWidth={2.5} aria-hidden />,
        warning: <AlertTriangle className="axar-toast__glyph" strokeWidth={2.5} aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "axar-toast",
          title: "axar-toast__title",
          description: "axar-toast__description",
          closeButton: "axar-toast__close",
          icon: "axar-toast__icon",
          content: "axar-toast__content",
          success: "axar-toast--success",
          error: "axar-toast--error",
          info: "axar-toast--info",
          warning: "axar-toast--warning",
        },
      }}
    />
  );
}
