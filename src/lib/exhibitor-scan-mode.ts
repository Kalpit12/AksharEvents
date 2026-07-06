export const EXHIBITOR_SCAN_MODE_KEY = "exhibitor-scan-mode";

export const EXHIBITOR_SCAN_MODE_EVENT = "exhibitor-scan-mode-change";

export function readExhibitorScanMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(EXHIBITOR_SCAN_MODE_KEY) === "1";
}

export function writeExhibitorScanMode(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.setItem(EXHIBITOR_SCAN_MODE_KEY, "1");
  } else {
    localStorage.removeItem(EXHIBITOR_SCAN_MODE_KEY);
  }
  window.dispatchEvent(new CustomEvent(EXHIBITOR_SCAN_MODE_EVENT, { detail: { enabled } }));
}
