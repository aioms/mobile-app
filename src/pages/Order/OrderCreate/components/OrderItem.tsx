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
    onRowChange,
    onRemoveItem,
  }) => {
    const [newQuantity, setNewQuantity] = useState<number>(quantity);
    const [formattedPrice, setFormattedPrice] = useState<string>(
      formatCurrencyWithoutSymbol(sellingPrice)
    );
    const [newPrice, setNewPrice] = useState<number>(sellingPrice);
    const [newVatRate, setNewVatRate] = useState<number>(vatRate);

    const handleQuantityChange = (value: number | null) => {
      if (value !== null && value >= 1) {
        setNewQuantity(value);
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 mr-2 min-w-max">
              Số lượng
            </span>
            <div className="flex items-center">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400"
                onClick={() =>
                  handleQuantityChange(newQuantity > 1 ? newQuantity - 1 : 1)
                }
                style={{ border: "none" }}
              >
                –
              </button>
              <span className="w-8 text-center">{newQuantity}</span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400"
                onClick={() => handleQuantityChange(newQuantity + 1)}
                style={{ border: "none" }}
              >
                +
              </button>
            </div>
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
