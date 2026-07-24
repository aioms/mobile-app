import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const appIconVariants = cva("ds-icon shrink-0", {
  variants: {
    size: {
      sm: "ds-icon-size-sm size-4",
      md: "ds-icon-size-md size-5",
      lg: "ds-icon-size-lg size-6",
    },
    tone: {
      primary: "ds-icon-tone-primary text-ds-text-primary",
      secondary: "ds-icon-tone-secondary text-ds-text-secondary",
      inverse: "ds-icon-tone-inverse text-ds-text-inverse",
      danger: "ds-icon-tone-danger text-ds-status-danger",
      success: "ds-icon-tone-success text-ds-status-success",
    },
  },
  defaultVariants: {
    size: "md",
    tone: "primary",
  },
});

type DecorativeIcon = {
  decorative?: true;
  label?: never;
};

type MeaningfulIcon = {
  decorative: false;
  label: string;
};

export type AppIconProps = {
  icon: LucideIcon;
  size?: NonNullable<VariantProps<typeof appIconVariants>["size"]>;
  tone?: NonNullable<VariantProps<typeof appIconVariants>["tone"]>;
  className?: string;
} & (DecorativeIcon | MeaningfulIcon);

export const AppIcon = forwardRef<SVGSVGElement, AppIconProps>(
  (
    {
      icon: Icon,
      size = "md",
      tone = "primary",
      className,
      decorative = true,
      label,
    },
    ref,
  ) => {
    if (!decorative && !label?.trim()) {
      throw new Error("AppIcon requires a non-empty label when meaningful");
    }

    return (
      <Icon
        ref={ref}
        className={cn(appIconVariants({ size, tone }), className)}
        aria-hidden={decorative ? "true" : undefined}
        aria-label={decorative ? undefined : label}
        role={decorative ? undefined : "img"}
      />
    );
  },
);

AppIcon.displayName = "AppIcon";
