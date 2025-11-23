import { FC, memo, useState, useEffect } from "react";
import { IonInput, IonIcon, IonButton } from "@ionic/react";
import { trashOutline } from "ionicons/icons";

import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";

type Props = {
  id: string;
  productName: string;
  code: string;
  quantity: number;
  sellingPrice: number;
  vatRate?: number;
  inventory?: number; // Add inventory prop for max quantity constraint
  attrs?: any;
  onRowChange?: (data: any) => void;
  onRemoveItem?: () => void;
};

const OrderItem: FC<Props> = memo(
  ({
    attrs,
    productName,
    code,
    quantity,
    sellingPrice,
    vatRate = 0,
    inventory,
    onRowChange,
    onRemoveItem,
  }) => {
    const [newQuantity, setNewQuantity] = useState<number>(quantity);
    const [formattedPrice, setFormattedPrice] = useState<string>(
      formatCurrencyWithoutSymbol(sellingPrice)
    );
    const [newPrice, setNewPrice] = useState<number>(sellingPrice);
    const [newVatRate, setNewVatRate] = useState<number>(vatRate);
    const [quantityInputValue, setQuantityInputValue] = useState<string>(quantity.toString());
    const [quantityError, setQuantityError] = useState<string>("");

    // Maximum quantity constraint based on inventory or reasonable limit
    const maxQuantity = inventory ?? 9999;
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

    const handleVatRateChange = (value: string | null | undefined) => {
      if (value !== null && value !== undefined) {
        const numericValue = Number(value) || 0;
        if (numericValue >= 0 && numericValue <= 100) {
          setNewVatRate(numericValue);
        }
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
      if (onRowChange) {
        onRowChange({
          quantity: newQuantity,
          sellingPrice: newPrice,
          vatRate: newVatRate,
        });
      }
    }, [newQuantity, newPrice, newVatRate]);

    const totalPrice = newPrice * newQuantity;
    const vatAmount = (totalPrice * newVatRate) / 100;
    const totalWithVat = totalPrice + vatAmount;

    return (
      <div className="border-b border-gray-200 py-3" {...attrs}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium">{productName}</div>
            <div className="text-xs text-gray-500">Mã SP: {code}</div>
          </div>
          <IonButton
            fill="clear"
            color="danger"
            size="small"
            onClick={onRemoveItem}
          >
            <IonIcon icon={trashOutline} />
          </IonButton>
        </div>

        <div className="grid grid-cols-1 gap-2 items-center">
          {/* Quantity Block */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500 min-w-max">
                Số lượng
              </span>
              {inventory !== undefined && (
                <span className="text-xs text-gray-400">
                  Tồn kho: {inventory}
                </span>
              )}
            </div>
            <div className="flex items-center">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`quantity-input w-12 h-8 mx-1 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${quantityError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                aria-label="Số lượng sản phẩm"
                autoComplete="off"
              />
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 min-w-max">Đơn giá</span>
            <IonInput
              value={formattedPrice}
              onIonInput={(e) => handlePriceChange(e.detail.value)}
              className="border rounded-lg text-sm w-28 custom-padding"
            />
          </div>
          {/* VAT Rate Block */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 min-w-max">VAT (%)</span>
            <IonInput
              value={newVatRate}
              onIonInput={(e) => handleVatRateChange(e.detail.value)}
              type="number"
              min="0"
              max="100"
              className="border rounded-lg text-sm w-28 custom-padding"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {formatCurrency(newPrice)} × {newQuantity}
            </div>
            <div className="text-xs text-gray-500">
              Tiền hàng: {formatCurrency(totalPrice)}
            </div>
            {newVatRate > 0 && (
              <div className="text-xs text-gray-500">
                VAT ({newVatRate}%): {formatCurrency(vatAmount)}
              </div>
            )}
            <div className="font-medium text-green-600">
              Tổng: {formatCurrency(totalWithVat)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default OrderItem;
