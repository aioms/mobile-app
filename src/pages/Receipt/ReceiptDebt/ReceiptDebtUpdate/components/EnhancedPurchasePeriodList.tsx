import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";
import { RECEIPT_DEBT_STATUS } from "@/common/constants/receipt-debt.constant";
import { IEnhancedPurchasePeriodListProps, IItemChangeData } from "../receiptDebtUpdate.d";
import EditableProductItem from "./EditableProductItem";

const EnhancedPurchasePeriodList: React.FC<IEnhancedPurchasePeriodListProps> = ({
  items = {},
  receiptStatus,
  onItemsChange,
  calculations,
}) => {
  // State to track current item index for each period
  const [currentItemIndexes, setCurrentItemIndexes] = useState<Record<string, number>>({});

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(items).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get all items as a flat array for counting
  const allItems = Object.values(items).flat();

  // Check if editing is disabled based on receipt status
  const isEditingDisabled = receiptStatus === RECEIPT_DEBT_STATUS.CANCELLED || 
                           receiptStatus === RECEIPT_DEBT_STATUS.COMPLETED;

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

  // Handle item changes
  const handleItemChange = (changeData: IItemChangeData) => {
    const updatedItems = { ...items };
    const periodItems = updatedItems[changeData.periodDate];
    
    if (periodItems) {
      const itemIndex = periodItems.findIndex(item => item.id === changeData.id);
      if (itemIndex !== -1) {
        updatedItems[changeData.periodDate][itemIndex] = {
          ...periodItems[itemIndex],
          quantity: changeData.quantity,
          costPrice: changeData.costPrice,
          hasChanges: true,
        };
      }
    }

    onItemsChange(updatedItems);
  };

  // Handle toggle edit mode
  const handleToggleEdit = (itemId: string) => {
    const updatedItems = { ...items };
    
    // Find and toggle the item's editing state
    Object.keys(updatedItems).forEach(periodDate => {
      const itemIndex = updatedItems[periodDate].findIndex(item => item.id === itemId);
      if (itemIndex !== -1) {
        updatedItems[periodDate][itemIndex] = {
          ...updatedItems[periodDate][itemIndex],
          isEditing: !updatedItems[periodDate][itemIndex].isEditing,
        };
      }
    });

    onItemsChange(updatedItems);
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
          const currentIndex = currentItemIndexes[date] || 0;
          const currentItem = dateItems[currentIndex];
          const formattedDate = getDate(date).format("DD/MM/YYYY");
          const periodTotal = calculations.periodTotals[date];

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
                      {formatCurrency(periodTotal?.amount || 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {dateItems.length} sản phẩm • {periodTotal?.quantity || 0} tổng số lượng
                  </p>
                  <p className="text-xs text-gray-400">
                    Tổng đợt thu
                  </p>
                </div>
              </div>

              {/* Current Item Display */}
              <div className="mb-4">
                <EditableProductItem
                  item={currentItem}
                  periodDate={date}
                  isDisabled={isEditingDisabled}
                  onItemChange={handleItemChange}
                  onToggleEdit={handleToggleEdit}
                />
              </div>

              {/* Navigation Controls */}
              {dateItems.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleNavigation(date, 'prev')}
                    disabled={currentIndex === 0}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      currentIndex === 0
                        ? "text-gray-300 cursor-not-allowed bg-gray-100"
                        : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-gray-700">
                      {currentIndex + 1} / {dateItems.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleNavigation(date, 'next')}
                    disabled={currentIndex === dateItems.length - 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      currentIndex === dateItems.length - 1
                        ? "text-gray-300 cursor-not-allowed bg-gray-100"
                        : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
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
                {sortedDates.length} đợt thu • {calculations.totalQuantity} sản phẩm
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-800">
                {formatCurrency(calculations.totalAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Warning */}
      {isEditingDisabled && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100">
          <div className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Không thể chỉnh sửa sản phẩm do trạng thái phiếu hiện tại.
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPurchasePeriodList;