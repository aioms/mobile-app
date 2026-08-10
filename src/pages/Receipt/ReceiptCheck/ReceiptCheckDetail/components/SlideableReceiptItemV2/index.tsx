import React, { useState, useEffect, useMemo } from "react";
import { IonChip } from "@ionic/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReceiptItemData {
  id: string;
  code: string;
  productName: string;
  productCode: string;
  systemInventory: number;
  actualInventory: number;
  costPrice: number;
}

interface SlideableReceiptItemProps {
  items: ReceiptItemData[];
  onSelect?: (id: string) => void;
  isEditable?: boolean;
  onItemUpdate?: (itemId: string, newInventory: number) => void;
}

const SlideableReceiptItem: React.FC<SlideableReceiptItemProps> = ({
  items,
  onSelect,
  isEditable = false,
  onItemUpdate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingInventory, setEditingInventory] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const currentItem = items[currentIndex];

  // Update editing inventory when current item changes
  useEffect(() => {
    if (currentItem) {
      setEditingInventory(currentItem.actualInventory.toString());
      setIsEditing(false);
    }
  }, [currentItem?.id, currentItem?.actualInventory]);

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return "success";
    return difference > 0 ? "warning" : "danger";
  };

  const getDifferencePrefix = (difference: number) => {
    if (difference > 0) return "+";
    return "";
  };

  const truncateProductName = (name: string, maxLength: number = 30) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  useEffect(() => {
    if (currentItem) {
      onSelect?.(currentItem.id);
    }
  }, [currentIndex, currentItem?.id, onSelect]);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleInventoryClick = () => {
    if (isEditable) {
      setIsEditing(true);
    }
  };

  const handleInventoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers (including negative)
    if (value === "" || value === "-" || !isNaN(Number(value))) {
      setEditingInventory(value);
    }
  };

  const handleInventoryBlur = () => {
    setIsEditing(false);
    const newInventory = parseInt(editingInventory, 10);
    
    // Validate the input
    if (isNaN(newInventory)) {
      // Reset to current value if invalid
      setEditingInventory(currentItem.actualInventory.toString());
      return;
    }

    // Update local state if the value changed
    if (newInventory !== currentItem.actualInventory && onItemUpdate) {
      onItemUpdate(currentItem.id, newInventory);
    }
  };

  const handleInventoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setEditingInventory(currentItem.actualInventory.toString());
      setIsEditing(false);
    }
  };

  if (!currentItem || items.length === 0) {
    return null;
  }

  const totalDifference = useMemo(() => {
    if (!currentItem) return 0;
    return currentItem.actualInventory - currentItem.systemInventory;
  }, [currentItem]);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/80">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-1 rounded-lg ${
            currentIndex === 0
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-[13px] font-medium text-gray-500">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
          className={`p-1 rounded-lg ${
            currentIndex === items.length - 1
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[42%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[22%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-50">
              <th className="px-3 py-2 text-left text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                Sản phẩm
              </th>
              <th className="px-1 py-2 text-center text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                Tồn kho
              </th>
              <th className="px-1 py-2 text-center text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                Thực tế
              </th>
              <th className="px-1 py-2 text-center text-[12px] font-medium text-gray-500 uppercase tracking-wide">
                Chênh lệch
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 align-middle">
                <div className="space-y-1">
                  <div
                    className="text-[13px] font-medium text-gray-900 leading-snug"
                    title={currentItem.productName}
                  >
                    {truncateProductName(currentItem.productName)}
                  </div>
                  <div className="text-[12px] text-gray-500 truncate">
                    {currentItem.code}
                  </div>
                </div>
              </td>
              <td className="px-1 py-3 text-center align-middle">
                <div className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-gray-100 text-gray-800 rounded-lg text-[13px] font-medium whitespace-nowrap">
                  {currentItem.systemInventory}
                </div>
              </td>
              <td className="px-1 py-3 text-center align-middle">
                {isEditable && isEditing ? (
                  <input
                    type="number"
                    value={editingInventory}
                    onChange={handleInventoryChange}
                    onBlur={handleInventoryBlur}
                    onKeyDown={handleInventoryKeyDown}
                    autoFocus
                    className="w-12 h-7 px-1 text-center border border-blue-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-[13px] font-medium"
                  />
                ) : (
                  <div 
                    className={`inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 bg-gray-100 text-gray-800 rounded-lg text-[13px] font-medium whitespace-nowrap ${isEditable ? 'cursor-pointer hover:bg-gray-200 border border-transparent hover:border-gray-300' : ''}`}
                    onClick={handleInventoryClick}
                  >
                    {currentItem.actualInventory}
                  </div>
                )}
              </td>
              <td className="px-1 py-3 text-center align-middle">
                <div
                  className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 text-white rounded-lg text-[13px] font-medium whitespace-nowrap ${
                    totalDifference === 0 ? 'bg-[#22C55E]' : totalDifference > 0 ? 'bg-orange-500' : 'bg-[#DC2626]'
                  }`}
                >
                  {getDifferencePrefix(totalDifference)}
                  {totalDifference}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SlideableReceiptItem;
