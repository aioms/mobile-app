import { FC, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IonButton, IonIcon } from "@ionic/react";
import { trashOutline } from "ionicons/icons";

import Counter from "@/components/Counter";
import { IProductItem } from "@/types/product.type";
import { getDate } from "@/helpers/date";
import { formatCurrency } from "@/helpers/formatters";

type Props = {
  items: IProductItem[]; // Changed to accept array of items
  periodDate?: string;
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
  onRemove?: (itemId: string) => void;
  editable?: boolean;
};

const PurchasePeriod: FC<Props> = ({
  items,
  periodDate,
  onQuantityChange,
  onRemove,
  editable = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Memoize initial quantities calculation
  const initialQuantities = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialQuantities);

  // Update quantities when items change
  useEffect(() => {
    setQuantities(initialQuantities);
    // Reset current index if it's out of bounds
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [initialQuantities, currentIndex, items.length]);

  // Memoize current item and total items
  const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
  const totalItems = useMemo(() => items.length, [items.length]);

  // Memoize display date calculation
  const displayDate = useMemo(() => {
    return periodDate
      ? getDate(periodDate).format("DD/MM/YYYY")
      : currentItem
      ? getDate(currentItem.createdAt).format("DD/MM/YYYY")
      : "";
  }, [periodDate, currentItem]);

  // Memoize total price calculation
  const totalPrice = useMemo(() => {
    if (!currentItem) return 0;
    const quantity = editable
      ? quantities[currentItem.id] || currentItem.quantity
      : currentItem.quantity;
    return currentItem.costPrice * quantity;
  }, [currentItem, editable, quantities]);

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

  const handleQuantityChange = (newQuantity: number) => {
    const itemId = currentItem.id;
    setQuantities((prev) => ({
      ...prev,
      [itemId]: newQuantity,
    }));
    onQuantityChange?.(itemId, newQuantity);
  };

  const handleRemove = () => {
    onRemove?.(currentItem.id);
    // Adjust current index if we're removing the last item
    if (currentIndex >= totalItems - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const truncateProductName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  if (!currentItem) {
    return null;
  }

  return (
    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 relative">
      {/* Remove button for editable mode */}
      {editable && onRemove && (
        <div className="absolute top-2 right-2">
          <IonButton
            fill="clear"
            size="small"
            color="danger"
            onClick={handleRemove}
          >
            <IonIcon icon={trashOutline} />
          </IonButton>
        </div>
      )}

      <div className="mb-3">
        <span className="text-sm text-blue-600 font-medium">
          Đợt {displayDate}
        </span>
        {editable && (
          <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
            Mới thêm
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 items-center">
        {/* Product Name and Quantity */}
        <div className="flex items-center justify-between">
          <span className="text-md font-semibold mr-2 break-words">
            {truncateProductName(currentItem.productName)}
          </span>
          <div className="flex items-center">
            {editable ? (
              <Counter
                value={quantities[currentItem.id] || currentItem.quantity}
                onChange={handleQuantityChange}
                disabled={false}
              />
            ) : (
              <span>SL: {currentItem.quantity || 0}</span>
            )}
          </div>
        </div>

        {/* Product Code and Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 mr-2 min-w-max">
            {currentItem.code}
          </span>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2 min-w-max">
              {formatCurrency(currentItem.costPrice)}
            </span>
          </div>
        </div>

        {/* Navigation and Total Price */}
        <div className="flex items-center justify-between">
          {/* Navigation controls - only show if multiple items */}
          {totalItems > 1 ? (
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

              <div className="text-center mx-2">
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
          ) : (
            <span className="text-sm text-gray-500">Sản phẩm duy nhất</span>
          )}

          <div className="flex items-center">
            <span className="text-sm font-semibold text-blue-600">
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePeriod;
