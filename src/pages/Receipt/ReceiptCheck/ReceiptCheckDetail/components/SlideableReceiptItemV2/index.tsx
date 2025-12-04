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
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-1 rounded ${
            currentIndex === 0
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-500">
          {currentIndex + 1} / {items.length}
        </span>
        <button
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
          className={`p-1 rounded ${
            currentIndex === items.length - 1
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-200"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[19%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-500">
                Sản phẩm
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500">
                Tồn kho
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500">
                Thực tế
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500">
                Chênh lệch
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-3 border-b">
                <div className="space-y-1">
                  <div
                    className="text-[13px] text-gray-900"
                    title={currentItem.productName}
                  >
                    {truncateProductName(currentItem.productName)}
                  </div>
                  <div className="text-[12px] text-gray-500 truncate">
                    {currentItem.code}
                  </div>
                </div>
              </td>
              <td className="px-2 py-3 border-b text-center">
                <IonChip className="m-0 justify-center w-6 min-w-[2rem]">
                  {currentItem.systemInventory}
                </IonChip>
              </td>
              <td className="px-2 py-3 border-b text-center">
                {isEditable && isEditing ? (
                  <input
                    type="number"
                    value={editingInventory}
                    onChange={handleInventoryChange}
                    onBlur={handleInventoryBlur}
                    onKeyDown={handleInventoryKeyDown}
                    autoFocus
                    className="w-full px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                ) : (
                  <IonChip 
                    className={`m-0 justify-center w-6 min-w-[2rem] ${isEditable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={handleInventoryClick}
                  >
                    {currentItem.actualInventory}
                  </IonChip>
                )}
              </td>
              <td className="px-2 py-3 border-b text-center">
                <IonChip
                  color={getDifferenceColor(totalDifference)}
                  className="m-0 justify-center w-6 min-w-[2rem]"
                >
                  {getDifferencePrefix(totalDifference)}
                  {totalDifference}
                </IonChip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SlideableReceiptItem;
