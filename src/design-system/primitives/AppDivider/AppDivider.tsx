import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appDividerVariants = cva("ds-divider shrink-0", {
  variants: {
    orientation: {
      horizontal: "ds-divider-horizontal h-px w-full",
      vertical: "ds-divider-vertical w-px",
    },
    tone: {
      default: "ds-divider-tone-default bg-ds-border-default",
      strong: "ds-divider-tone-strong bg-ds-border-strong",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    tone: "default",
  },
});

export interface AppDividerProps {
  orientation?: NonNullable<
    VariantProps<typeof appDividerVariants>["orientation"]
  >;
  tone?: NonNullable<VariantProps<typeof appDividerVariants>["tone"]>;
  decorative?: boolean;
  className?: string;
}

export const AppDivider: React.FC<AppDividerProps> = ({
  orientation = "horizontal",
  tone = "default",
  decorative = true,
  className,
}) => (
  <div
    role={decorative ? undefined : "separator"}
    aria-hidden={decorative ? "true" : undefined}
    aria-orientation={decorative ? undefined : orientation}
    className={cn(appDividerVariants({ orientation, tone }), className)}
  />
);
