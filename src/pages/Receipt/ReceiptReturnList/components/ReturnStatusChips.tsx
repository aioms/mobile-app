import React from "react";
import { ReceiptReturnStatus } from "@/types/receipt-return.type";

export interface StatusFilterOption {
  key: string; // 'all' | ReceiptReturnStatus | 'exchange'
  label: string;
  count?: number;
}

interface ReturnStatusChipsProps {
  selectedStatus: string;
  onChange: (statusKey: string) => void;
  counts?: {
    all: number;
    draft: number;
    processing: number;
    completed: number;
    cancelled: number;
  };
  className?: string;
}

const ReturnStatusChips: React.FC<ReturnStatusChipsProps> = ({
  selectedStatus,
  onChange,
  counts,
  className = "",
}) => {
  const options: StatusFilterOption[] = [
    {
      key: "all",
      label: "Tất cả",
      count: counts?.all,
    },
    {
      key: ReceiptReturnStatus.DRAFT,
      label: "Chờ xử lý",
      count: (counts?.draft || 0) + (counts?.processing || 0),
    },
    {
      key: ReceiptReturnStatus.COMPLETED,
      label: "Đã hoàn tất",
      count: counts?.completed,
    },
    {
      key: ReceiptReturnStatus.CANCELLED,
      label: "Đã hủy",
      count: counts?.cancelled,
    },
  ];

  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-4 ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {options.map((option) => {
        const isActive = selectedStatus === option.key;
        return (
          <button
            key={option.key}
            type="button"
            data-cy={`return-status-chip-${option.key}`}
            onClick={() => onChange(option.key)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 flex-shrink-0 flex items-center gap-1.5 active:scale-95 ${
              isActive
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-blue-700/60 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ReturnStatusChips;
