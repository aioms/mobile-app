import React, { useState, useEffect, useMemo } from "react";
import { IonChip } from "@ionic/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReceiptItemData {
  id: string;
  productName: string;
  productCode: string;
  systemInventory: number;
  actualInventory: number;
  costPrice: number;
}

interface SlideableReceiptItemProps {
  items: ReceiptItemData[];
  onSelect?: (id: string) => void;
}

const SlideableReceiptItem: React.FC<SlideableReceiptItemProps> = ({
  items,
  onSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];

  const getDifferenceColor = (difference: number) => {
    if (difference === 0) return "success";
    return difference > 0 ? "warning" : "danger";
  };

  const getDifferencePrefix = (difference: number) => {
    if (difference > 0) return "+";
    return "";
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

  if (!currentItem || items.length === 0) {
    return null;
  }

  const totalDifference = useMemo(() => {
    if (!currentItem) return 0;
    return currentItem.actualInventory - currentItem.systemInventory;
  }, [currentItem]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-1 rounded ${
            currentIndex === 0
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1">
          <h3 className="font-medium text-gray-900">
            {currentItem.productName}
          </h3>
          <p className="text-sm text-gray-500">{currentItem.productCode}</p>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
          className={`p-1 rounded ${
            currentIndex === items.length - 1
              ? "text-gray-300"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Values Table */}
      <div className="divide-y">
        <div className="flex items-center px-4 py-3">
          <div className="w-1/3">
            <p className="text-sm text-gray-500">Giá trị tồn</p>
          </div>
          <div className="w-2/3 text-right">
            <IonChip>{currentItem.systemInventory}</IonChip>
          </div>
        </div>

        <div className="flex items-center px-4 py-3">
          <div className="w-1/3">
            <p className="text-sm text-gray-500">Giá trị thực tế</p>
          </div>
          <div className="w-2/3 text-right">
            <IonChip>{currentItem.actualInventory}</IonChip>
          </div>
        </div>

        <div className="flex items-center px-4 py-3">
          <div className="w-1/3">
            <p className="text-sm text-gray-500">Chênh lệch</p>
          </div>
          <div className="w-2/3 text-right">
            <IonChip
              color={getDifferenceColor(totalDifference)}
              className="m-0"
            >
              {getDifferencePrefix(totalDifference)}
              {totalDifference}
            </IonChip>
          </div>
        </div>
      </div>

      {/* Pagination Indicator */}
      <div className="px-4 py-2 bg-gray-50 text-center text-sm text-gray-500">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
};

export default SlideableReceiptItem;
