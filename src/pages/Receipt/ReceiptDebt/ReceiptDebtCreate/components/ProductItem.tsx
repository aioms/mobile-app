import { FC, memo, useState, useEffect } from "react";
import { IonInput, IonIcon, IonButton, IonCheckbox } from "@ionic/react";
import { trashOutline } from "ionicons/icons";

import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
  formatProductCode,
} from "@/helpers/formatters";

type Props = {
  productName: string;
  code: string;
  quantity: number;
  sellingPrice: number;
  inventory?: number; // Add inventory prop for max quantity constraint
  shipNow?: boolean;
  recipientName?: string;
  attrs?: any;
  onRowChange?: (data: any) => void;
  onRemoveItem?: () => void;
};

const ProductItem: FC<Props> = memo(
  ({
    attrs,
    productName,
    code,
    quantity,
    sellingPrice,
    inventory,
    shipNow = false,
    recipientName = "",
    onRowChange,
    onRemoveItem,
  }) => {
    const [newQuantity, setNewQuantity] = useState<number>(quantity);
    const [formattedPrice, setFormattedPrice] = useState<string>(
      formatCurrencyWithoutSymbol(sellingPrice)
    );
    const [newPrice, setNewPrice] = useState<number>(sellingPrice);
    const [quantityInputValue, setQuantityInputValue] = useState<string>(quantity.toString());
    const [quantityError, setQuantityError] = useState<string>("");
    const [isShipNow, setIsShipNow] = useState<boolean>(shipNow);
    const [recipientNameInput, setRecipientNameInput] = useState<string>(recipientName);

    // Maximum quantity constraint based on inventory or reasonable limit
    const maxQuantity = isShipNow ? 9999 : (inventory ?? 9999);
    const minQuantity = 1;

    const validateQuantity = (value: number): { isValid: boolean; error?: string } => {
      if (isNaN(value)) {
        return { isValid: false, error: "Vui lòng nhập số hợp lệ" };
      }
      if (value < minQuantity) {
        return { isValid: false, error: `Số lượng tối thiểu là ${minQuantity}` };
      }
      if (value > maxQuantity) {
        return { isValid: false, error: `Số lượng tối đa là ${maxQuantity}` };
      }
      return { isValid: true };
    };

    const updateQuantity = (value: number) => {
      const validation = validateQuantity(value);

      if (validation.isValid) {
        setNewQuantity(value);
        setQuantityInputValue(value.toString());
        setQuantityError("");
      } else {
        setQuantityError(validation.error || "");
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

        updateQuantity(numericValue);
      }
    };

    const handleQuantityInputBlur = () => {
      if (quantityInputValue === "" || isNaN(parseInt(quantityInputValue, 10))) {
        // Reset to current valid quantity
        setQuantityInputValue(newQuantity.toString());
        setQuantityError("");
      }
    };

    const handleQuantityInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const numericValue = parseInt(quantityInputValue, 10);
        if (!isNaN(numericValue)) {
          updateQuantity(numericValue);
        }
        (e.target as HTMLInputElement).blur();
      }
    };

    const handleQuantityChange = (value: number | null) => {
      if (value !== null && value >= 1) {
        updateQuantity(value);
      }
    };

    const handlePriceChange = (value: string | null | undefined) => {
      if (value !== null && value !== undefined) {
        const numericValue = parseCurrencyInput(value);
        if (numericValue >= 0) {
          setNewPrice(numericValue);
          setFormattedPrice(formatCurrencyWithoutSymbol(numericValue));
        }
      }
    };

    const handleShipNowChange = (checked: boolean) => {
      setIsShipNow(checked);
      // Revalidate quantity when shipNow changes
      if (!checked && inventory !== undefined && newQuantity > inventory) {
        setNewQuantity(inventory);
        setQuantityInputValue(inventory.toString());
      }
    };

    useEffect(() => {
      if (quantity !== newQuantity) {
        setNewQuantity(quantity);
        setQuantityInputValue(quantity.toString());
        setQuantityError("");
      }
    }, [quantity]);

    useEffect(() => {
      if (recipientName !== undefined && recipientName !== recipientNameInput) {
        setRecipientNameInput(recipientName);
      }
    }, [recipientName]);

    useEffect(() => {
      if (onRowChange) {
        onRowChange({
          quantity: newQuantity,
          sellingPrice: newPrice,
          shipNow: isShipNow,
          recipientName: recipientNameInput,
        });
      }
    }, [newQuantity, newPrice, isShipNow, recipientNameInput]);

    const totalPrice = newPrice * newQuantity;

    return (
      <div
        className={`border p-3.5 sm:p-4 rounded-xl mb-3.5 shadow-sm transition-colors ${
          isShipNow
            ? 'bg-orange-50/80 border-orange-200'
            : 'bg-white border-gray-200'
        }`}
        {...attrs}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="pr-2">
            <div className="font-semibold text-gray-900 text-base leading-snug">{productName}</div>
            <div className="text-xs text-gray-500 mt-0.5">Mã SP: {formatProductCode(code)}</div>
          </div>
          <button
            type="button"
            className="text-red-500 hover:text-red-600 p-1.5 -mr-1 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors"
            onClick={onRemoveItem}
            aria-label="Xóa"
          >
            <IonIcon icon={trashOutline} className="text-xl" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Quantity Block */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-gray-700 min-w-max">
                Số lượng
              </span>
              {inventory !== undefined && (
                <span className="text-xs text-gray-500">
                  Tồn kho: {inventory}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-teal-600 active:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() =>
                  handleQuantityChange(newQuantity > minQuantity ? newQuantity - 1 : minQuantity)
                }
                style={{ border: "none" }}
                disabled={newQuantity <= minQuantity}
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
                className={`quantity-input w-16 h-10 mx-2 text-center text-base font-semibold border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${
                  quantityError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                aria-label="Số lượng sản phẩm"
                autoComplete="off"
              />
              <button
                type="button"
                className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl font-bold text-teal-600 active:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleQuantityChange(newQuantity + 1)}
                style={{ border: "none" }}
                disabled={newQuantity >= maxQuantity}
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
            {quantityError && (
              <div className="mt-1">
                <span className="text-xs text-red-600">{quantityError}</span>
              </div>
            )}
          </div>

          {/* Price Block */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700 min-w-max">Đơn giá</span>
            <IonInput
              value={formattedPrice}
              onIonInput={(e) => handlePriceChange(e.detail.value)}
              className="border border-gray-300 rounded-lg text-sm font-semibold w-44 custom-padding bg-white text-right h-10"
            />
          </div>

          {/* Recipient Block */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700 min-w-max">Người nhận</span>
            <IonInput
              value={recipientNameInput}
              placeholder="Tên người nhận"
              onIonInput={(e) => setRecipientNameInput(e.detail.value || "")}
              className="border border-gray-300 rounded-lg text-sm font-medium w-44 custom-padding bg-white text-right h-10"
            />
          </div>
        </div>

        <div className={`flex justify-between items-center mt-3.5 pt-3 border-t ${
          isShipNow ? 'border-orange-200' : 'border-gray-100'
        }`}>
          <div className="flex items-center">
            <IonCheckbox
              checked={isShipNow}
              onIonChange={(e) => handleShipNowChange(e.detail.checked)}
              className="ship-now-checkbox"
              style={{ "--border-radius": "4px" }}
            />
            <span className={`ml-2 text-sm ${isShipNow ? 'text-orange-600 font-semibold' : 'text-gray-700 font-medium'} `}>
              Giao ngay
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {formatCurrency(newPrice)} × {newQuantity}
            </div>
            <div className="font-bold text-base text-green-600">
              {formatCurrency(totalPrice)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ProductItem;
