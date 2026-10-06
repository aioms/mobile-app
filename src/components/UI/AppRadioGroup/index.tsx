import React from "react";
import { cn } from "@/lib/utils";

export interface AppRadioOption<T = string | number> {
  value: T;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
  dataCy?: string;
}

export type AppRadioGroupSize = "sm" | "md" | "lg";

export interface AppRadioGroupProps<T = string | number> {
  options: AppRadioOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  name?: string;
  columns?: number;
  size?: AppRadioGroupSize;
  className?: string;
  itemClassName?: string;
}

const AppRadioGroup = <T extends string | number>({
  options,
  value,
  onChange,
  disabled = false,
  name,
  columns,
  size = "md",
  className = "",
  itemClassName = "",
}: AppRadioGroupProps<T>) => {
  const getGridColsClass = () => {
    const count = columns || options.length;
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      default:
        return "grid-flow-col auto-cols-fr";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "min-h-[36px] py-1.5 px-3 text-xs";
      case "lg":
        return "min-h-[48px] py-2.5 px-4 text-base";
      case "md":
      default:
        return "min-h-[44px] py-2 px-3 text-sm";
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("grid gap-2", getGridColsClass(), className)}
    >
      {options.map((option) => {
        const isSelected = value === option.value;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            data-cy={option.dataCy}
            onClick={() => !isDisabled && onChange(option.value)}
            className={cn(
              "rounded-lg border flex flex-col items-center justify-center text-center transition-all select-none active:scale-[0.98]",
              getSizeClasses(),
              isSelected
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold"
                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 font-medium",
              isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
              itemClassName
            )}
          >
            <span className={isSelected ? "font-semibold" : "font-medium"}>
              {option.label}
            </span>
            {option.description && (
              <span
                className={cn(
                  "text-xs mt-0.5",
                  isSelected ? "text-blue-100 font-normal" : "text-gray-500 font-normal"
                )}
              >
                {option.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default AppRadioGroup;
