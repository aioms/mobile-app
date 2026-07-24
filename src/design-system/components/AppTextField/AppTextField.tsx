import React, { forwardRef } from "react";
import { ListInput } from "konsta/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AppTextFieldProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "color" | "size" | "style" | "onChange"
    > {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  size?: "md" | "lg";
  state?: "default" | "error";
  helperText?: string;
  errorText?: string;
  leadingIcon?: LucideIcon;
  trailingAction?: React.ReactNode;
}

export const AppTextField = forwardRef<HTMLInputElement, AppTextFieldProps>(
  (
    {
      label,
      value,
      onValueChange,
      size = "md",
      state = "default",
      helperText,
      errorText,
      leadingIcon: LeadingIcon,
      trailingAction,
      id,
      disabled,
      className,
      type = "text",
      ...inputProps
    },
    ref,
  ) => {
    const isError = state === "error";
    // Konsta UI has error and info props
    // We pass error={isError} and the text in either info or error depending on state
    
    const sizeClasses = size === "lg" 
      ? "!text-lg !h-14" 
      : "!text-base !h-12";
      
    return (
      <div className="relative w-full">
        <ListInput
          inputId={id}
          label={label}
          type={type}
          value={value}
          outline
          floatingLabel
          onChange={(e: any) => onValueChange(e.target.value)}
          error={isError ? (errorText || helperText) : undefined}
          info={!isError ? helperText : undefined}
          disabled={disabled}
          className={className}
          inputClassName={cn(sizeClasses, (inputProps as any).inputClassName)}
          media={LeadingIcon ? <LeadingIcon className="w-6 h-6" /> : undefined}
          {...(inputProps as any)}
        />
        {trailingAction && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
            {trailingAction}
          </div>
        )}
      </div>
    );
  },
);

AppTextField.displayName = "AppTextField";
