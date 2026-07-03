import { toast, type ExternalToast } from "sonner";

const defaults: ExternalToast = {
  duration: 3200,
};

export const notify = {
  success(message: string, options?: ExternalToast) {
    toast.success(message, { ...defaults, ...options });
  },
  error(message: string, options?: ExternalToast) {
    toast.error(message, { ...defaults, duration: 4200, ...options });
  },
  info(message: string, options?: ExternalToast) {
    toast.info(message, { ...defaults, ...options });
  },
  warning(message: string, options?: ExternalToast) {
    toast.warning(message, { ...defaults, duration: 3800, ...options });
  },
};
