"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type ParamUpdate = Record<string, string | null | undefined>;

function buildUrl(pathname: string, params: URLSearchParams) {
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function applyUpdates(current: URLSearchParams, updates: ParamUpdate) {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === "") next.delete(key);
    else next.set(key, value);
  }
  return next;
}

/**
 * Dashboard tab/filter state in the URL without triggering a Next.js server navigation.
 * Uses history.replaceState so switching tabs stays client-side and instant.
 */
export function useDashboardUrlState() {
  const pathname = usePathname();
  const nextSearchParams = useSearchParams();
  const [params, setParamsState] = useState(
    () => new URLSearchParams(nextSearchParams.toString())
  );

  useEffect(() => {
    setParamsState(new URLSearchParams(nextSearchParams.toString()));
  }, [nextSearchParams]);

  useEffect(() => {
    const onPopState = () => {
      setParamsState(new URLSearchParams(window.location.search));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const getParam = useCallback((key: string, fallback = "") => params.get(key) ?? fallback, [params]);

  const setParams = useCallback(
    (updates: ParamUpdate) => {
      setParamsState((current) => {
        const next = applyUpdates(current, updates);
        const url = buildUrl(pathname, next);
        window.history.replaceState(window.history.state, "", url);
        return next;
      });
    },
    [pathname]
  );

  return { getParam, setParams, searchParams: params };
}

export function useUrlEnumState<T extends string>(
  key: string,
  validValues: readonly T[],
  defaultValue: T,
  clearWhenDefault = true
): [T, (value: T, extraUpdates?: ParamUpdate) => void] {
  const { getParam, setParams } = useDashboardUrlState();

  const value = useMemo(() => {
    const raw = getParam(key);
    if (raw && (validValues as readonly string[]).includes(raw)) return raw as T;
    return defaultValue;
  }, [getParam, key, validValues, defaultValue]);

  const setValue = useCallback(
    (next: T, extraUpdates?: ParamUpdate) => {
      const updates: ParamUpdate = { ...extraUpdates };
      if (clearWhenDefault && next === defaultValue) updates[key] = null;
      else updates[key] = next;
      setParams(updates);
    },
    [key, defaultValue, clearWhenDefault, setParams]
  );

  return [value, setValue];
}

export function useUrlStringState(key: string, defaultValue = ""): [string, (value: string) => void] {
  const { getParam, setParams } = useDashboardUrlState();

  const value = getParam(key, defaultValue);

  const setValue = useCallback(
    (next: string) => {
      setParams({ [key]: next === defaultValue ? null : next });
    },
    [key, defaultValue, setParams]
  );

  return [value, setValue];
}
