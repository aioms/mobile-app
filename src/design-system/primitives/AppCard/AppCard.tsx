import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appCardVariants = cva(
  "ds-card rounded-ds-card border border-ds-border-default text-ds-text-primary",
  {
    variants: {
      surface: {
        default: "ds-card-surface-default bg-ds-surface-default",
        subtle: "ds-card-surface-subtle bg-ds-surface-subtle",
      },
      elevation: {
        none: "ds-card-elevation-none shadow-none",
        raised: "ds-card-elevation-raised shadow-ds-raised",
      },
      padding: {
        none: "ds-card-padding-none p-0",
        sm: "ds-card-padding-sm p-ds-2",
        md: "ds-card-padding-md p-ds-4",
        lg: "ds-card-padding-lg p-ds-6",
      },
      interactive: {
        true: "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-focus focus-visible:ring-offset-2",
        false: "",
      },
    },
    defaultVariants: {
      surface: "default",
      elevation: "none",
      padding: "md",
      interactive: false,
    },
  },
);

export interface AppCardProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      "color" | "style"
    >,
    VariantProps<typeof appCardVariants> {
  interactive?: boolean;
}

export const AppCard = forwardRef<HTMLDivElement, AppCardProps>(
  (
    {
      surface = "default",
      elevation = "none",
      padding = "md",
      interactive = false,
      className,
      onClick,
      onKeyDown,
      ...cardProps
    },
    ref,
  ) => {
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (
        interactive &&
        !event.defaultPrevented &&
        (event.key === "Enter" || event.key === " ")
      ) {
        event.preventDefault();
        onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    return (
      <div
        {...cardProps}
        ref={ref}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          appCardVariants({ surface, elevation, padding, interactive }),
          className,
        )}
      />
    );
  },
);

AppCard.displayName = "AppCard";
