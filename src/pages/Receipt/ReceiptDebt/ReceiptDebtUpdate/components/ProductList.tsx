import React, { useState, useEffect } from "react";
import { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductItem from "./ProductItem";

interface ProductData {
  id: string;
  productName: string;
  productCode: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date?: string;
}

type Props = {
  items: ProductData[];
  onSelect?: (id: string) => void;
};

const ProductList: FC<Props> = ({ items = [], onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];

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
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 text-center text-gray-500">
        Không có sản phẩm nào
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Navigation Controls */}
      {/* <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full transition-colors ${
            currentIndex === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-200 active:bg-gray-300"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <span className="text-sm font-medium text-gray-700">
            {currentIndex + 1} / {items.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === items.length - 1}
          className={`p-2 rounded-full transition-colors ${
            currentIndex === items.length - 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-200 active:bg-gray-300"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div> */}

      {/* Product Item Display */}
      <ProductItem item={currentItem} totalItems={items.length} />
    </div>
  );
};

export default ProductList;
