import { FC, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IonButton, IonIcon, IonInput, IonCheckbox } from "@ionic/react";
import { trashOutline, createOutline } from "ionicons/icons";

import { IReceiptItemPeriod } from "@/types/receipt-debt.type";
import { getDate } from "@/helpers/date";
import { formatCurrency, formatCurrencyWithoutSymbol, parseCurrencyInput } from "@/helpers/formatters";

type Props = {
  items: IReceiptItemPeriod[]; // Changed to accept array of items
  periodDate?: string;
  onQuantityChange?: (itemId: string, newQuantity: number) => void;
  onPriceChange?: (itemId: string, newPrice: number) => void;
  onRemove?: (itemId: string) => void;
  onShipNowChange?: (itemId: string, shipNow: boolean) => void;
  editable?: boolean;
};

const PurchasePeriod: FC<Props> = ({
  items,
  periodDate,
  onQuantityChange,
  onPriceChange,
  onRemove,
  onShipNowChange,
  editable = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState("");
  const [quantityInputValue, setQuantityInputValue] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [shipNowStates, setShipNowStates] = useState<Record<string, boolean>>({});

  // Memoize initial quantities calculation
  const initialQuantities = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  // Memoize initial prices calculation
  const initialPrices = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.id] = item.sellingPrice;
      return acc;
    }, {} as Record<string, number>);
  }, [items]);

  const [quantities, setQuantities] =
    useState<Record<string, number>>(initialQuantities);
  const [prices, setPrices] = useState<Record<string, number>>(initialPrices);

  // Initialize shipNow states from items
  useEffect(() => {
    const initialShipNow = items.reduce((acc, item) => {
      acc[item.id] = item.shipNow || false;
      return acc;
    }, {} as Record<string, boolean>);
    setShipNowStates(initialShipNow);
  }, [items]);

  // Memoize current item and total items
  const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
  const totalItems = useMemo(() => items.length, [items.length]);

  // Get available inventory for current item
  const getAvailableInventory = (item: IReceiptItemPeriod): number => {
    const inventory = item.inventory || 0;
    return Math.max(0, inventory);
  };

  // Maximum quantity constraint based on shipNow state
  const maxQuantity = useMemo(() => {
    if (!currentItem) return 0;
    const isShipNow = shipNowStates[currentItem.id] || false;
    return isShipNow ? 9999 : getAvailableInventory(currentItem);
  }, [currentItem]);

  const minQuantity = 1;

  const validateQuantity = (value: number): { isValid: boolean; error?: string } => {
    if (isNaN(value)) {
      return { isValid: false, error: "Vui lòng nhập số hợp lệ" };
    }
    if (value < minQuantity) {
      return { isValid: false, error: `Số lượng tối thiểu là ${minQuantity}` };
    }
    if (value > maxQuantity) {
      return { isValid: false, error: `Số lượng tối đa là ${maxQuantity} (tồn kho)` };
    }
    return { isValid: true };
  };

  const updateQuantity = (value: number) => {
    const validation = validateQuantity(value);

    if (validation.isValid) {
      setQuantityError("");
      return true;
    } else {
      setQuantityError(validation.error || "");
      return false;
    }
  };

  // Update quantities and prices when items change
  useEffect(() => {
    setQuantities(initialQuantities);
    setPrices(initialPrices);
    // Reset current index if it's out of bounds
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [initialQuantities, initialPrices, currentIndex, items.length]);

  // Update quantity input value when current item changes
  useEffect(() => {
    if (currentItem) {
      const currentQuantity = quantities[currentItem.id] || currentItem.quantity;
      setQuantityInputValue(currentQuantity.toString());
      setQuantityError("");
    }
  }, [currentItem, quantities]);

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

    const price = editable
      ? prices[currentItem.id] || currentItem.costPrice
      : currentItem.costPrice;
    return price * quantity;
  }, [currentItem, editable, quantities, prices]);

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

  const handleQuantityInputChange = (value: string | null | undefined) => {
    if (value !== null && value !== undefined) {
      setQuantityInputValue(value);
      const numericValue = parseInt(value, 10);

      if (value === "" || isNaN(numericValue)) {
        setQuantityError("Vui lòng nhập số hợp lệ");
        return;
      }

      if (numericValue < 0) {
        setQuantityError("Số lượng không thể âm");
        return;
      }

      if (updateQuantity(numericValue)) {
        handleQuantityChange(numericValue);
      }
    }
  };

  // Handle decrement button with special case for quantity 1 -> 0
  const handleDecrement = () => {
    const currentQty = quantities[currentItem.id] || currentItem.quantity;
    const newQuantity = currentQty > minQuantity ? currentQty - 1 : minQuantity;

    if (newQuantity === 0 && currentQty === 1 && totalItems === 1) {
      // This is the last item and user is trying to set quantity to 0
      // Let the parent component handle the confirmation modal
      handleQuantityChange(0);
    } else if (updateQuantity(newQuantity)) {
      handleQuantityChange(newQuantity);
    }
  };

  const handleQuantityInputBlur = () => {
    if (quantityInputValue === "" || isNaN(parseInt(quantityInputValue, 10))) {
      // Reset to current valid quantity
      const currentQuantity = quantities[currentItem.id] || currentItem.quantity;
      setQuantityInputValue(currentQuantity.toString());
      setQuantityError("");
    }
  };

  const handleQuantityInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const numericValue = parseInt(quantityInputValue, 10);
      if (!isNaN(numericValue) && updateQuantity(numericValue)) {
        handleQuantityChange(numericValue);
      }
      (e.target as HTMLInputElement).blur();
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

  const handlePriceChange = (newPrice: number) => {
    const itemId = currentItem.id;
    setPrices((prev) => ({
      ...prev,
      [itemId]: newPrice,
    }));
    onPriceChange?.(itemId, newPrice);
  };

  const handlePriceEdit = () => {
    const currentPrice = prices[currentItem.id] || currentItem.costPrice;
    setPriceInputValue(formatCurrencyWithoutSymbol(currentPrice));
    setEditingPrice(true);
  };

  const handlePriceInputChange = (value: string) => {
    // Format the input value for display
    const numericValue = parseCurrencyInput(value);
    const formattedValue = formatCurrencyWithoutSymbol(numericValue);
    setPriceInputValue(formattedValue);

    // Update the actual price
    handlePriceChange(numericValue);
  };

  const handlePriceBlur = () => {
    setEditingPrice(false);
    setPriceInputValue("");
  };

  const handleRemove = () => {
    onRemove?.(currentItem.id);
    // Adjust current index if we're removing the last item
    if (currentIndex >= totalItems - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShipNowChange = (checked: boolean) => {
    const itemId = currentItem.id;
    setShipNowStates((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
    onShipNowChange?.(itemId, checked);

    // Revalidate quantity when shipNow changes
    const currentQty = quantities[itemId] || currentItem.quantity;
    if (!checked && currentQty > getAvailableInventory(currentItem)) {
      const newQty = getAvailableInventory(currentItem);
      setQuantities((prev) => ({ ...prev, [itemId]: newQty }));
      setQuantityInputValue(newQty.toString());
      onQuantityChange?.(itemId, newQty);
    }
  };

  const truncateProductName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  if (!currentItem) {
    return null;
  }

  const isShipNow = shipNowStates[currentItem?.id] || false;

  return (
    <div className={`p-4 border-l-4 ${isShipNow ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'} relative`}>
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
        {editable && currentItem.id.startsWith("temp_") && (
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
              <div className="flex items-center">
                <button
                  type="button"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${(quantities[currentItem.id] || currentItem.quantity) <= minQuantity
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-teal-400 hover:bg-gray-200"
                    }`}
                  onClick={handleDecrement}
                  disabled={(quantities[currentItem.id] || currentItem.quantity) <= minQuantity}
                  style={{ border: "none" }}
                  aria-label="Giảm số lượng"
                >
                  –
                </button>
                <input
                  type="number"
                  value={quantityInputValue}
                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                  onBlur={handleQuantityInputBlur}
                  onKeyDown={handleQuantityInputKeyPress}
                  min={minQuantity}
                  max={maxQuantity}
                  className={`quantity-input w-12 h-8 mx-1 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${quantityError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  aria-label="Số lượng sản phẩm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${(quantities[currentItem.id] || currentItem.quantity) >= maxQuantity
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-teal-400 hover:bg-gray-200"
                    }`}
                  onClick={() => {
                    const currentQty = quantities[currentItem.id] || currentItem.quantity;
                    if (updateQuantity(currentQty + 1)) {
                      handleQuantityChange(currentQty + 1);
                    }
                  }}
                  disabled={(quantities[currentItem.id] || currentItem.quantity) >= maxQuantity}
                  style={{ border: "none" }}
                  aria-label="Tăng số lượng"
                >
                  +
                </button>
              </div>
            ) : (
              <span>SL: {currentItem.quantity || 0}</span>
            )}
          </div>
        </div>

        {/* Inventory Display */}
        {editable && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-500">
              SL khả dụng: {maxQuantity}
            </span>
          </div>
        )}

        {/* Quantity Error */}
        {quantityError && (
          <div className="mb-2">
            <span className="text-xs text-red-600">{quantityError}</span>
          </div>
        )}

        {/* Product Code and Price */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 mr-2 min-w-max">
            {currentItem.code}
          </span>
          <div className="flex items-center">
            {editable && editingPrice ? (
              <IonInput
                type="text"
                value={priceInputValue}
                onIonInput={(e) => {
                  handlePriceInputChange(e.detail.value!);
                }}
                onIonBlur={handlePriceBlur}
                className="text-sm border border-gray-300 rounded w-32"
                placeholder="0"
              />
            ) : (
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-1 min-w-max">
                  {formatCurrency(prices[currentItem.id] || currentItem.costPrice)}
                </span>
                {editable && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={handlePriceEdit}
                    className="ml-1"
                  >
                    <IonIcon icon={createOutline} className="text-xs" />
                  </IonButton>
                )}
              </div>
            )}
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
                className={`p-2 rounded-full transition-colors ${currentIndex === 0
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
                className={`p-2 rounded-full transition-colors ${currentIndex === totalItems - 1
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
            <span className={`text-sm font-semibold ${isShipNow ? 'text-orange-600' : 'text-blue-600'}`}>
              {formatCurrency(totalPrice)}
            </span>
          </div>
        </div>

        {/* Ship Now Checkbox */}
        {editable && (
          <div className="flex items-center mt-3">
            <IonCheckbox
              checked={isShipNow}
              onIonChange={(e) => handleShipNowChange(e.detail.checked)}
              className="ship-now-checkbox"
              style={{ "--border-radius": "4px" }}
            />
            <span className={`ml-2 text-sm ${isShipNow ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
              Giao ngay
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePeriod;
