"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
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
  const selected = options.find((o) => o.value === value);
  const radixValue = value || undefined;

  return (
    <SelectPrimitive.Root value={radixValue} onValueChange={onChange}>
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background text-left text-sm shadow-sm transition-colors",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "data-[placeholder]:text-muted-foreground",
          size === "sm" ? "h-9 px-3" : "h-10 px-3",
          triggerClassName,
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selected?.label ?? (value || placeholder)}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground opacity-70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-[9999] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border",
            "bg-card text-foreground shadow-xl"
          )}
          position="popper"
          sideOffset={4}
        >
          <SelectPrimitive.Viewport className="bg-card p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-lg bg-card py-2 pl-8 pr-3 text-sm text-foreground outline-none",
                  "data-[highlighted]:bg-champagne/10 data-[highlighted]:text-espresso",
                  "dark:data-[highlighted]:bg-champagne/15 dark:data-[highlighted]:text-champagne-light"
                )}
              >
                <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-primary" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
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
