import Counter from "@/components/Counter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FC, useState } from "react";

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
  item: ProductData;
  totalItems: number;
};

const ProductItem: FC<Props> = ({ item, totalItems }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const truncateProductName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  return (
    <div className="p-4">
      {/* Date Header */}
      {item.date && (
        <div className="mb-3">
          <span className="text-sm text-blue-600 font-medium">
            Đợt {item.date}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 items-center">
        {/* Quantity Block */}
        <div className="flex items-center justify-between">
          <span className="text-md font-semibold mr-2 min-w-max">
            {item.productName}
          </span>
          <div className="flex items-center">
            <Counter
              value={item.quantity}
              onChange={(value) => {
                console.log(value);
              }}
            />
          </div>
        </div>
        {/* Price Block */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 mr-2 min-w-max">
            {item.productCode}
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2 min-w-max">
              {formatCurrency(item.unitPrice)}đ
            </span>
          </div>
        </div>
        {/* Total Price Block */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 min-w-max flex items-center">
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
                {currentIndex + 1} / {totalItems}
              </span>
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === totalItems - 1}
              className={`p-2 rounded-full transition-colors ${
                currentIndex === totalItems - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-600 hover:bg-gray-200 active:bg-gray-300"
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2 min-w-max">
              {formatCurrency(item.totalPrice)}đ
            </span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-3">
        {/* <div>
          <h3
            className="text-base font-medium text-gray-900 mb-1"
            title={item.productName}
          >
            {truncateProductName(item.productName)}
          </h3>
          <p className="text-sm text-gray-500">{item.productCode}</p>
        </div> */}

        {/* Quantity and Price Section */}
        <div className="flex items-center justify-between">
          {/* Quantity Controls */}
          {/* <div className="flex items-center space-x-3">
            <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
              <span className="text-lg leading-none">−</span>
            </button>

            <div className="bg-gray-100 px-4 py-2 rounded-lg min-w-[60px] text-center">
              <span className="text-lg font-medium">{item.quantity}</span>
            </div>

            <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">
              <span className="text-lg leading-none">+</span>
            </button>
          </div> */}

          {/* Price Display */}
          {/* <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              {formatCurrency(item.unitPrice)}đ
            </div>
            <div className="text-lg font-semibold text-orange-500">
              {formatCurrency(item.totalPrice)}đ
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
