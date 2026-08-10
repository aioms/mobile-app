import { formatCurrency, parseCurrencyInput } from "@/helpers/formatters";
import {
  IonButton,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
} from "@ionic/react";
import { add, remove, trash } from "ionicons/icons";
import { FC, useEffect, useState } from "react";

type Props = {
  id: string;
  productName: string;
  productCode: number;
  code: string;
  inventory: number;
  costPrice: number;
  discount: number;
  quantity?: number; // Add quantity prop
  onRowChange?: (data: any) => void;
  onRemoveItem?: (id: string) => void;
};

const ReceiptItem: FC<Props> = ({
  id,
  productCode,
  productName,
  code,
  inventory,
  costPrice,
  discount,
  quantity: initialQuantity = 1, // Accept quantity prop with default value
  onRowChange,
  onRemoveItem,
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [formattedCostPrice, setformattedCostPrice] = useState<string>(
    formatCurrency(costPrice)
  );
  const [newCostPrice, setNewCostPrice] = useState<number>(costPrice);
  const [newDiscount, setNewDiscount] = useState<number>(discount);

  const handleCostPriceChange = (value: string | null | undefined) => {
    if (value !== null && value !== undefined) {
      const numericValue = parseCurrencyInput(value);
      if (numericValue >= 0) {
        setNewCostPrice(numericValue);
        setformattedCostPrice(formatCurrency(numericValue));
      }
    }
  };

  const handleDiscountChange = (value: number | null) => {
    if (value !== null && value >= 0 && value <= 100) {
      setNewDiscount(value);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 0) {
      setQuantity(newQuantity);
    }
  };

  // Add useEffect to sync internal state with prop changes
  useEffect(() => {
    setQuantity(initialQuantity);
  }, [initialQuantity]);

  useEffect(() => {
    if (typeof newCostPrice === "number" && typeof newDiscount === "number") {
      if (typeof quantity === "number") {
        const totalPrice = quantity * newCostPrice * (1 - newDiscount / 100);
        onRowChange?.({
          id,
          productCode,
          productName,
          code,
          inventory,
          quantity,
          costPrice: newCostPrice,
          discount: newDiscount,
          totalPrice,
        });
      }
    }
  }, [newCostPrice, newDiscount, quantity]);

  return (
    <div className="p-4 bg-white border-b border-gray-100 last:border-b-0 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight">{productName}</h3>
          <p className="text-gray-500 text-xs mt-0.5">{code}</p>
          <div className="text-gray-500 text-xs mt-1">
            Tồn kho: <span className="font-medium">{inventory}</span>
          </div>
        </div>
        <button
          className="p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-red-50 transition-colors"
          onClick={() => onRemoveItem?.(id)}
          aria-label="Xóa sản phẩm"
        >
          <IonIcon icon={trash} className="text-red-500 text-lg" />
        </button>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Giá nhập</label>
          <input
            type="text"
            value={formattedCostPrice}
            onChange={(e) => handleCostPriceChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Chiết khấu (%)</label>
          <div className="relative">
            <input
              type="number"
              value={newDiscount}
              onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg h-9 pl-3 pr-6 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
          </div>
        </div>
      </div>

      {/* Quantity Controls and Total */}
      <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">SL:</span>
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg h-8 px-1">
            <button
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-white rounded"
              onClick={() => handleQuantityChange(quantity - 1)}
            >
              <IonIcon icon={remove} className="text-sm" />
            </button>
            <input
              type="number"
              className="w-10 bg-transparent text-center text-sm font-medium focus:outline-none"
              value={quantity}
              onChange={(e) => {
                const value = e.currentTarget.value ? parseInt(e.currentTarget.value.toString()) : 0;
                handleQuantityChange(value);
              }}
            />
            <button
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-500 hover:bg-white rounded"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <IonIcon icon={add} className="text-sm" />
            </button>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-sm text-blue-600">
            {formatCurrency(quantity * newCostPrice * (1 - newDiscount / 100))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptItem;
