import { FC, useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IonButton, IonIcon, IonInput, IonCheckbox, CheckboxChangeEventDetail } from "@ionic/react";
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

const minQuantity = 1;

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

  // Memoize base current item and total items
  const baseCurrentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
  const totalItems = useMemo(() => items.length, [items.length]);
  const isNewItem = useMemo(() => baseCurrentItem.id.startsWith("temp_"), [baseCurrentItem]);

  // Create enhanced currentItem that merges base item with local state changes
  const currentItem = useMemo(() => {
    if (!baseCurrentItem) return baseCurrentItem;

    // console.log('-----------');
    // console.log({ items, baseCurrentItem });
    // console.log({ quantities, prices, shipNowStates });
    // console.log('-----------');

    return {
      ...baseCurrentItem,
      quantity: quantities[baseCurrentItem.id] ?? baseCurrentItem.quantity,
      sellingPrice: prices[baseCurrentItem.id] ?? baseCurrentItem.sellingPrice,
      costPrice: prices[baseCurrentItem.id] ?? baseCurrentItem.costPrice,
      shipNow: shipNowStates[baseCurrentItem.id] ?? baseCurrentItem.shipNow ?? false,
    };
  }, [baseCurrentItem, quantities, prices, shipNowStates]);

  // Get available inventory for current item
  const getAvailableInventory = (item: IReceiptItemPeriod): number => {
    const inventory = item.inventory || 0;
    return Math.max(0, inventory);
  };

  // Maximum quantity constraint based on shipNow state
  const maxQuantity = useMemo(() => {
    if (!currentItem) return 0;
    return currentItem.shipNow ? 9999 : getAvailableInventory(currentItem);
  }, [currentItem]);

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
    // If current item is not new and value is less than original quantity
    if (currentItem.originalQuantity && value < currentItem.originalQuantity) {
      return { isValid: false, error: `Số lượng đã nhập không được nhỏ hơn số lượng cũ` };
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

  // Reset current index if it's out of bounds
  useEffect(() => {
    if (currentIndex >= items.length && items.length > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, items.length]);

  // Update quantity input value when current item changes
  useEffect(() => {
    if (currentItem) {
      setQuantityInputValue(currentItem.quantity.toString());
      setQuantityError("");
    }
  }, [currentItem]);

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
    const price = editable && isNewItem ? currentItem.sellingPrice : currentItem.costPrice;
    return price * currentItem.quantity;
  }, [currentItem]);

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
    const currentQty = currentItem.quantity;
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
      const currentQuantity = currentItem.quantity;
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
    setPriceInputValue(formatCurrencyWithoutSymbol(currentItem.sellingPrice));
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

  const handleShipNowChange = (e: CustomEvent<CheckboxChangeEventDetail>) => {
    const checked = e.detail.checked;
    const itemId = currentItem.id;

    setShipNowStates((prev) => ({
      ...prev,
      [itemId]: checked,
    }));
    onShipNowChange?.(itemId, checked);

    // Revalidate quantity when shipNow changes
    if (!checked) {
      const availableQuantity = getAvailableInventory(currentItem);
      const newQty = availableQuantity;
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

  const isShipNow = currentItem?.shipNow;

  // useEffect(() => {
  //   console.log('Enhanced currentItem:', {
  //     id: currentItem?.id,
  //     name: currentItem.productName,
  //     quantity: currentItem?.quantity,
  //     costPrice: currentItem?.costPrice,
  //     sellingPrice: currentItem?.sellingPrice,
  //     shipNow: currentItem?.shipNow,
  //     metadata: currentItem?.metadata,
  //     maxQuantity,
  //     isNewItem,
  //     isShipNow
  //   });
  // }, [currentItem]);

  const isShowButtonRemove = useMemo(() => {
    return editable && isNewItem && onRemove && !currentItem.originalQuantity;
  }, [editable, isNewItem, onRemove]);

  return (
    <div className={`p-4 border-l-4 ${isShipNow ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'} relative`}>
      {/* Remove button for editable mode */}
      {isShowButtonRemove && (
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
        {editable && isNewItem && (
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
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${currentItem.quantity <= minQuantity
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-teal-400 hover:bg-gray-200"
                    }`}
                  onClick={handleDecrement}
                  disabled={currentItem.quantity <= minQuantity || !isNewItem}
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
                  disabled={!isNewItem}
                  className={`quantity-input w-12 h-8 mx-1 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${quantityError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  aria-label="Số lượng sản phẩm"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${currentItem.quantity >= maxQuantity
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 text-teal-400 hover:bg-gray-200"
                    }`}
                  onClick={() => {
                    if (updateQuantity(currentItem.quantity + 1)) {
                      handleQuantityChange(currentItem.quantity + 1);
                    }
                  }}
                  disabled={currentItem.quantity >= maxQuantity || !isNewItem}
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
                  {/* Nếu là đợt cũ thì sử dụng costPrice từ receipt item */}
                  {formatCurrency(editable && isNewItem ? currentItem.sellingPrice : currentItem.costPrice)}
                </span>
                {editable && isNewItem && (
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
        {editable ? (
          <div className="flex items-center mt-3">
            <IonCheckbox
              checked={isShipNow}
              disabled={getAvailableInventory(currentItem) === 0}
              onIonChange={handleShipNowChange}
              className="ship-now-checkbox"
              style={{ "--border-radius": "4px" }}
            />
            <span className={`ml-2 text-sm ${isShipNow ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
              Giao ngay
            </span>
          </div>
        ) : (
          <div className="flex items-center mt-3">
            <span className={`text-sm ${isShipNow ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
              {isShipNow && 'Giao ngay'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchasePeriod;
