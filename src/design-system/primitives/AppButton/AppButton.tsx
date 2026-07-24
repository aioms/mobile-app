import React, { forwardRef } from "react";
import { Button } from "konsta/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppButtonProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      "color" | "style"
    > {
  tone?: "primary" | "neutral" | "danger";
  variant?: "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: LucideIcon;
  trailingIcon?: LucideIcon;
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      tone = "primary",
      variant = "solid",
      size = "md",
      fullWidth = false,
      loading = false,
      leadingIcon: LeadingIcon,
      trailingIcon: TrailingIcon,
      disabled,
      className,
      children,
      type = "button",
      ...buttonProps
    },
    ref,
  ) => {
    // Map our tones/variants to Konsta UI Button props
    const isOutline = variant === "outline";
    const isClear = variant === "ghost";
    const isSmall = size === "sm";
    const isLarge = size === "lg";
    
    // Map tone to Konsta's color classes
    let buttonColorClass = "";
    if (tone === "danger") {
      buttonColorClass = "k-color-red";
    } else if (tone === "neutral") {
      buttonColorClass = "k-color-gray";
    }

    return (
      <Button
        ref={ref}
        component="button"
        type={type}
        disabled={disabled || loading}
        outline={isOutline}
        clear={isClear}
        small={isSmall}
        large={isLarge}
        className={cn(
          buttonColorClass,
          !fullWidth && "w-auto inline-flex",
          "gap-2 items-center justify-center",
          className
        )}
        {...(buttonProps as any)}
      >
        {LeadingIcon ? <LeadingIcon aria-hidden="true" className="size-5" /> : null}
        <span>{children}</span>
        {TrailingIcon ? (
          <TrailingIcon aria-hidden="true" className="size-5" />
        ) : null}
      </Button>
    );
  },
);

AppButton.displayName = "AppButton";
