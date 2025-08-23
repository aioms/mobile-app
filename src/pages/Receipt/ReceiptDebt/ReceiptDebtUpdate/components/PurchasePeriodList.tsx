import { useState } from "react";
import { FC } from "react";

import { IProductItem } from "@/types/product.type";
import PurchasePeriod from "./PurchasePeriod";
import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";

type Props = {
  items: Record<string, IProductItem[]>;
};

const PurchasePeriodList: FC<Props> = ({ items = {} }) => {
  // State to track current item index for each period
  const [currentItemIndexes, setCurrentItemIndexes] = useState<Record<string, number>>({});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(items).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get all items as a flat array for counting
  const allItems = Object.values(items).flat();

  // Calculate total for a specific period
  const calculatePeriodTotal = (periodItems: IProductItem[]) => {
    return periodItems.reduce((total, item) => {
      return total + (item.costPrice * item.quantity);
    }, 0);
  };

  // Calculate grand total across all periods
  const calculateGrandTotal = () => {
    return allItems.reduce((total, item) => {
      return total + (item.costPrice * item.quantity);
    }, 0);
  };

  // Handle navigation for a specific period
  const handleNavigation = (periodDate: string, direction: 'prev' | 'next') => {
    const periodItems = items[periodDate];
    if (!periodItems || periodItems.length <= 1) return;

    const currentIndex = currentItemIndexes[periodDate] || 0;
    let newIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < periodItems.length - 1) {
      newIndex = currentIndex + 1;
    }

    setCurrentItemIndexes(prev => ({
      ...prev,
      [periodDate]: newIndex
    }));
  };

  if (allItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-3">
        <h2 className="text-xl font-bold text-foreground mt-2 px-4 pt-4">Sản phẩm</h2>
        <div className="p-4 text-center text-gray-500 text-base">
          Chưa có sản phẩm nào
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-3">
      <h2 className="text-xl font-bold text-foreground mt-2 px-4 pt-4">Sản phẩm</h2>

      <div className="divide-y divide-gray-100">
        {sortedDates.map((date) => {
          const dateItems = items[date];
          const formattedDate = getDate(date).format("DD/MM/YYYY");
          const currentIndex = currentItemIndexes[date] || 0;
          const currentItem = dateItems[currentIndex];
          const periodTotal = calculatePeriodTotal(dateItems);

          return (
            <div key={date} className="p-4">
              {/* Period Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-600">
                    Đợt thu {formattedDate}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(periodTotal)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {dateItems.length} sản phẩm
                  </p>
                  <p className="text-xs text-gray-400">
                    Tổng đợt thu
                  </p>
                </div>
              </div>

              {/* Current Item Display */}
              <PurchasePeriod
                item={currentItem}
                currentIndex={currentIndex}
                totalItems={dateItems.length}
                onNavigate={(direction) => handleNavigation(date, direction)}
              />
            </div>
          );
        })}
      </div>

      {/* Grand Total Section */}
      {allItems.length > 0 && (
        <div className="px-4 py-4 bg-blue-50 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-800">
                Tổng tất cả đợt thu
              </h3>
              <p className="text-sm text-blue-600">
                {sortedDates.length} đợt thu • {allItems.length} sản phẩm
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-800">
                {formatCurrency(calculateGrandTotal())}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchasePeriodList;
