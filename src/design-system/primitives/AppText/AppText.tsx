import React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const appTextVariants = cva("ds-text", {
  variants: {
    variant: {
      display: "ds-text-display text-ds-display",
      title: "ds-text-title text-ds-title",
      heading: "ds-text-heading text-ds-heading",
      body: "ds-text-body text-ds-body",
      label: "ds-text-label text-ds-label",
      caption: "ds-text-caption text-ds-caption",
    },
    tone: {
      primary: "ds-text-tone-primary text-ds-text-primary",
      secondary: "ds-text-tone-secondary text-ds-text-secondary",
      disabled: "ds-text-tone-disabled text-ds-text-disabled",
      inverse: "ds-text-tone-inverse text-ds-text-inverse",
      danger: "ds-text-tone-danger text-ds-status-danger",
      success: "ds-text-tone-success text-ds-status-success",
    },
  },
  defaultVariants: {
    variant: "body",
    tone: "primary",
  },
});

export type AppTextVariant = NonNullable<
  VariantProps<typeof appTextVariants>["variant"]
>;
export type AppTextTone = NonNullable<
  VariantProps<typeof appTextVariants>["tone"]
>;

export interface AppTextProps {
  as?: "span" | "p" | "div" | "label" | "h1" | "h2" | "h3" | "h4";
  variant?: AppTextVariant;
  tone?: AppTextTone;
  truncate?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  as: Component = "span",
  variant = "body",
  tone = "primary",
  truncate = false,
  className,
  children,
}) => {
  const accessibleFullText =
    truncate && typeof children === "string" ? children : undefined;

  return (
    <Component
      className={cn(
        appTextVariants({ variant, tone }),
        truncate && "truncate",
        className,
      )}
      title={accessibleFullText}
    >
      {children}
    </Component>
  );
};
