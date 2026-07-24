import React, { forwardRef, useId, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

const appSearchFieldVariants = cva(
  "ds-search-field flex w-full items-center gap-2 rounded-ds-control border border-ds-border-default bg-ds-surface-default px-3 text-ds-text-primary transition-colors focus-within:ring-2 focus-within:ring-ds-focus motion-reduce:transition-none",
  {
    variants: {
      size: {
        md: "ds-search-field-size-md min-h-11",
        lg: "ds-search-field-size-lg min-h-12",
      },
      disabled: {
        true: "cursor-not-allowed bg-ds-surface-subtle opacity-50",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      disabled: false,
    },
  },
);

export interface AppSearchFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "type" | "color" | "size" | "style" | "onChange"
    >,
    Pick<VariantProps<typeof appSearchFieldVariants>, "size"> {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  onClear?: () => void;
  loading?: boolean;
}

export const AppSearchField = forwardRef<
  HTMLInputElement,
  AppSearchFieldProps
>(
  (
    {
      label = "Tìm kiếm",
      value,
      onValueChange,
      onClear,
      loading = false,
      size = "md",
      id,
      disabled,
      className,
      ...inputProps
    },
    forwardedRef,
  ) => {
    const generatedId = useId();
    const inputId = id ?? `ds-search-field-${generatedId}`;
    const inputRef = useRef<HTMLInputElement | null>(null);

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;

      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    const handleClear = () => {
      onValueChange("");
      onClear?.();
      inputRef.current?.focus();
    };

    return (
      <div
        className={cn(
          appSearchFieldVariants({ size, disabled: Boolean(disabled) }),
          className,
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <Search
          aria-hidden="true"
          className="size-5 shrink-0 text-ds-text-secondary"
        />
        <input
          {...inputProps}
          ref={setInputRef}
          id={inputId}
          type="search"
          value={value}
          disabled={disabled}
          aria-busy={loading || undefined}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          className="ds-search-field-input min-h-ds-control min-w-0 flex-1 border-0 bg-transparent p-0 text-ds-body text-ds-text-primary outline-none placeholder:text-ds-text-disabled disabled:cursor-not-allowed"
        />
        {loading ? (
          <span
            role="status"
            aria-live="polite"
            className="ds-search-field-status sr-only"
          >
            Đang tìm kiếm
          </span>
        ) : null}
        {value ? (
          <button
            type="button"
            aria-label="Xóa tìm kiếm"
            onClick={handleClear}
            className="ds-search-field-clear inline-flex size-11 shrink-0 items-center justify-center rounded-ds-control text-ds-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus disabled:pointer-events-none"
            disabled={disabled}
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>
    );
  },
);

AppSearchField.displayName = "AppSearchField";
