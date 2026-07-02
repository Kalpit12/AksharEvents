/** Hide Event Master / Printing header links on pages where they are redundant. */
export function shouldShowStaffHeaderLinks(pathname: string): boolean {
  if (pathname === "/") return false;
  if (pathname.startsWith("/auth/exhibitor")) return false;
  return true;
}
