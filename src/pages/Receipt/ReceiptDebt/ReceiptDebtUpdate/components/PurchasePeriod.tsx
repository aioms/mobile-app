import { FC } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { IProductItem } from "@/types/product.type";
import { formatCurrency } from "@/helpers/formatters";

type Props = {
  item: IProductItem;
  currentIndex: number;
  totalItems: number;
  onNavigate: (direction: 'prev' | 'next') => void;
};

const PurchasePeriod: FC<Props> = ({
  item,
  currentIndex,
  totalItems,
  onNavigate
}) => {
  const truncateProductName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  const totalPrice = item.costPrice * item.quantity;

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate('prev');
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate('next');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Product Info */}
      <div className="mb-4">
        <h4
          className="text-md font-bold text-gray-900 mb-3"
          title={item.productName}
        >
          {truncateProductName(item.productName)}
        </h4>
        <div className="flex items-center space-x-2 text-base text-gray-600">
          <span>Mã: {item.code}</span>
        </div>
      </div>

      {/* Quantity and Price Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-base font-semibold text-gray-600">Số lượng:</span>
          <div className="text-md font-bold text-gray-900">{item.quantity}</div>
        </div>
        <div>
          <span className="text-base font-semibold text-gray-600">Đơn giá:</span>
          <div className="text-md font-bold text-gray-900">
            {formatCurrency(item.costPrice)}
          </div>
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-4 p-4 bg-white rounded-lg">
        <span className="text-lg font-semibold text-gray-600">Tổng tiền:</span>
        <div className="text-lg font-bold text-blue-600">
          {formatCurrency(totalPrice)}
        </div>
      </div>

      {/* Navigation Controls */}
      {totalItems > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${currentIndex === 0
              ? "text-gray-300 cursor-not-allowed bg-gray-100"
              : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-white shadow-sm"
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-gray-700">
              {currentIndex + 1} / {totalItems}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentIndex === totalItems - 1}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${currentIndex === totalItems - 1
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
};

export default PurchasePeriod;
