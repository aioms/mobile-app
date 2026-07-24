import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const appIconButtonVariants = cva(
  "ds-icon-button inline-flex min-h-11 min-w-11 items-center justify-center rounded-ds-control border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
  {
    variants: {
      tone: {
        primary: "ds-icon-button-tone-primary",
        neutral: "ds-icon-button-tone-neutral",
        danger: "ds-icon-button-tone-danger",
      },
      variant: {
        solid: "ds-icon-button-variant-solid",
        outline: "ds-icon-button-variant-outline bg-transparent",
        ghost:
          "ds-icon-button-variant-ghost border-transparent bg-transparent",
      },
      size: {
        sm: "ds-icon-button-size-sm size-11",
        md: "ds-icon-button-size-md size-11",
        lg: "ds-icon-button-size-lg size-12",
      },
    },
    compoundVariants: [
      {
        tone: "primary",
        variant: "solid",
        className:
          "border-ds-action-primary bg-ds-action-primary text-ds-text-inverse",
      },
      {
        tone: "neutral",
        variant: "solid",
        className:
          "border-ds-action-neutral bg-ds-action-neutral text-ds-text-primary",
      },
      {
        tone: "danger",
        variant: "solid",
        className:
          "border-ds-status-danger bg-ds-status-danger text-ds-text-inverse",
      },
      {
        tone: "primary",
        variant: ["outline", "ghost"],
        className: "border-ds-action-primary text-ds-action-primary",
      },
      {
        tone: "neutral",
        variant: ["outline", "ghost"],
        className: "border-ds-border-strong text-ds-text-primary",
      },
      {
        tone: "danger",
        variant: ["outline", "ghost"],
        className: "border-ds-status-danger text-ds-status-danger",
      },
    ],
    defaultVariants: {
      tone: "primary",
      variant: "solid",
      size: "md",
    },
  },
);

export interface AppIconButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "children" | "color" | "style"
    >,
    VariantProps<typeof appIconButtonVariants> {
  icon: LucideIcon;
  label: string;
  loading?: boolean;
}

export const AppIconButton = forwardRef<
  HTMLButtonElement,
  AppIconButtonProps
>(
  (
    {
      icon: Icon,
      label,
      tone = "primary",
      variant = "solid",
      size = "md",
      loading = false,
      disabled,
      className,
      type = "button",
      ...buttonProps
    },
    ref,
  ) => {
    if (!label.trim()) {
      throw new Error("AppIconButton requires a non-empty label");
    }

    return (
      <button
        {...buttonProps}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-label={label}
        aria-busy={loading || undefined}
        className={cn(
          appIconButtonVariants({ tone, variant, size }),
          className,
        )}
      >
        <Icon aria-hidden="true" className={size === "lg" ? "size-6" : "size-5"} />
      </button>
    );
  },
);

AppIconButton.displayName = "AppIconButton";
