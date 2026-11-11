import React from "react";
import AppBadge from "@/components/UI/AppBadge";
import { FilterTabOption, NotificationCategory } from "../types";

interface NotificationFilterTabsProps {
  current: NotificationCategory;
  options: FilterTabOption[];
  onChange: (category: NotificationCategory) => void;
}

const NotificationFilterTabs: React.FC<NotificationFilterTabsProps> = ({
  current,
  options,
  onChange,
}) => {
  return (
    <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-100">
      {options.map((option) => {
        const isActive = current === option.key;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange(option.key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all active:scale-95 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{option.label}</span>
            {option.badge !== undefined && option.badge > 0 && (
              <AppBadge
                color={isActive ? "light" : "danger"}
                variant="solid"
                className="!px-1.5 !py-0 !text-[10px] !min-w-[16px] !h-4 flex items-center justify-center font-bold"
              >
                {option.badge > 99 ? "99+" : option.badge}
              </AppBadge>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationFilterTabs;
