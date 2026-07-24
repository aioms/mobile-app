import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appSkeletonVariants = cva(
  "ds-skeleton animate-pulse motion-reduce:animate-none",
  {
    variants: {
      shape: {
        text: "ds-skeleton-shape-text space-y-2",
        rectangle:
          "ds-skeleton-shape-rectangle w-full rounded-ds-control bg-ds-surface-subtle",
        circle:
          "ds-skeleton-shape-circle rounded-full bg-ds-surface-subtle",
      },
      size: {
        sm: "ds-skeleton-size-sm",
        md: "ds-skeleton-size-md",
        lg: "ds-skeleton-size-lg",
      },
    },
    compoundVariants: [
      { shape: "rectangle", size: "sm", className: "h-12" },
      { shape: "rectangle", size: "md", className: "h-20" },
      { shape: "rectangle", size: "lg", className: "h-32" },
      { shape: "circle", size: "sm", className: "size-8" },
      { shape: "circle", size: "md", className: "size-12" },
      { shape: "circle", size: "lg", className: "size-16" },
    ],
    defaultVariants: {
      shape: "text",
      size: "md",
    },
  },
);

const appSkeletonLineVariants = cva(
  "ds-skeleton-line block rounded-ds-pill bg-ds-surface-subtle",
  {
    variants: {
      size: {
        sm: "h-2",
        md: "h-3",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AppSkeletonProps {
  shape?: NonNullable<VariantProps<typeof appSkeletonVariants>["shape"]>;
  size?: NonNullable<VariantProps<typeof appSkeletonVariants>["size"]>;
  lines?: number;
  className?: string;
}

export const AppSkeleton: React.FC<AppSkeletonProps> = ({
  shape = "text",
  size = "md",
  lines = 1,
  className,
}) => {
  const lineCount = Number.isFinite(lines)
    ? Math.max(1, Math.floor(lines))
    : 1;

  return (
    <div
      aria-hidden="true"
      data-shape={shape}
      data-size={size}
      className={cn(appSkeletonVariants({ shape, size }), className)}
    >
      {shape === "text"
        ? Array.from({ length: lineCount }, (_, index) => (
            <span
              key={index}
              className={cn(
                appSkeletonLineVariants({ size }),
                index === lineCount - 1 ? "w-3/4" : "w-full",
              )}
            />
          ))
        : null}
    </div>
  );
};
