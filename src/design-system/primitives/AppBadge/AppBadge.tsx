import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appBadgeVariants = cva(
  "ds-badge inline-flex max-w-full items-center rounded-ds-pill font-medium whitespace-normal break-words",
  {
    variants: {
      tone: {
        neutral:
          "ds-badge-tone-neutral bg-ds-surface-subtle text-ds-text-primary",
        info: "ds-badge-tone-info bg-ds-status-info-subtle text-ds-status-info",
        success:
          "ds-badge-tone-success bg-ds-status-success-subtle text-ds-status-success",
        warning:
          "ds-badge-tone-warning bg-ds-status-warning-subtle text-ds-status-warning",
        danger:
          "ds-badge-tone-danger bg-ds-status-danger-subtle text-ds-status-danger",
      },
      size: {
        sm: "ds-badge-size-sm min-h-6 px-2 py-0.5 text-ds-caption",
        md: "ds-badge-size-md min-h-7 px-2.5 py-1 text-ds-label",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AppBadgeProps {
  tone: NonNullable<VariantProps<typeof appBadgeVariants>["tone"]>;
  size?: NonNullable<VariantProps<typeof appBadgeVariants>["size"]>;
  className?: string;
  children: React.ReactNode;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  tone,
  size = "md",
  className,
  children,
}) => (
  <span className={cn(appBadgeVariants({ tone, size }), className)}>
    {children}
  </span>
);
