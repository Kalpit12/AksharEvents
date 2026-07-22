"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
  /** Shorter label for the closed trigger; full `label` is shown in the menu */
  triggerLabel?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
  id?: string;
};

/** Radix Select requires a non-empty controlled value; map "" to this sentinel. */
const EMPTY_SELECT_VALUE = "__empty__";

function normalizeSelectValue(value: string) {
  return value === "" ? EMPTY_SELECT_VALUE : value;
}

function denormalizeSelectValue(value: string) {
  return value === EMPTY_SELECT_VALUE ? "" : value;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  className,
  triggerClassName,
  size = "default",
  id,
}: Props) {
  const normalizedOptions = options.map((option) => ({
    ...option,
    value: normalizeSelectValue(option.value),
  }));
  const radixValue = normalizeSelectValue(value);
  const selected = normalizedOptions.find((o) => o.value === radixValue);
  const hasSelection = value !== "" && Boolean(selected);

  return (
    <SelectPrimitive.Root
      value={hasSelection ? radixValue : undefined}
      onValueChange={(next) => onChange(denormalizeSelectValue(next))}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full min-h-10 items-center justify-between gap-2 rounded-lg border border-input bg-background text-left text-sm shadow-sm transition-colors",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "data-[placeholder]:text-muted-foreground",
          size === "sm" ? "h-9 px-3" : "px-3 py-2",
          triggerClassName,
          className
        )}
      >
        <SelectPrimitive.Value
          placeholder={placeholder}
          className="min-w-0 flex-1 truncate leading-snug"
        >
          {selected?.triggerLabel ?? selected?.label}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "z-[9999] max-h-[min(24rem,70vh)] w-[var(--radix-select-trigger-width)] max-w-[min(100vw-2rem,36rem)] overflow-hidden rounded-xl border border-border",
            "bg-card text-foreground shadow-xl"
          )}
          position="popper"
          side="bottom"
          align="start"
          sideOffset={4}
          collisionPadding={12}
          avoidCollisions={false}
        >
          <SelectPrimitive.Viewport className="max-h-[min(24rem,70vh)] overflow-y-auto bg-card p-1">
            {normalizedOptions.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                textValue={option.triggerLabel ?? option.label}
                className={cn(
                  "relative flex cursor-pointer select-none items-start rounded-lg bg-card py-2.5 pl-8 pr-3 text-sm text-foreground outline-none",
                  "data-[highlighted]:bg-champagne/10 data-[highlighted]:text-espresso",
                  "dark:data-[highlighted]:bg-champagne/15 dark:data-[highlighted]:text-champagne-light"
                )}
              >
                <span className="absolute left-2 top-2.5 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText className="whitespace-normal leading-snug">
                  {option.label}
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/** Map plain string options (empty string = placeholder entry, filtered out) */
export function toSelectOptions(options: string[], placeholder?: string): CustomSelectOption[] {
  return options
    .filter((o) => o !== "")
    .map((o) => ({ value: o, label: o }));
}

/** For filters with an "all" empty value */
export function toSelectOptionsWithAll(
  options: string[],
  allLabel: string,
  allValue = "__all__"
): CustomSelectOption[] {
  return [{ value: allValue, label: allLabel }, ...options.map((o) => ({ value: o, label: o }))];
}

export function fromAllValue(value: string, allValue = "__all__"): string {
  return value === allValue ? "" : value;
}

export function toAllValue(value: string, allValue = "__all__"): string {
  return value || allValue;
}
