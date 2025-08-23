import { formatCurrency } from "@/helpers/formatters";
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

  const parseCurrencyInput = (value: string): number => {
    // Remove all non-digit characters and parse to number
    return parseInt(value.replace(/\D/g, "")) || 0;
  };

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
    <IonItem>
      <div className="py-4 shadow-sm space-y-4 border-b-2 border-gray-500/10">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium text-lg">{productName}</h3>
                <p className="text-gray-500">{code}</p>
                <div className="text-gray-500">
                  Tồn kho: {inventory} • Giá:{" "}
                  {costPrice.toLocaleString("vi-VN")}
                </div>
              </div>
              <IonFabButton
                size="small"
                color="danger"
                onClick={() => {
                  onRemoveItem?.(id);
                }}
              >
                <IonIcon icon={trash} size="small"></IonIcon>
              </IonFabButton>
            </div>
          </div>
        </div>

        {/* Cost Price Input */}
        <div className="flex items-center">
          <div className="flex-1 mr-2">
            <IonLabel position="stacked">Giá nhập</IonLabel>
            <IonInput
              type="text"
              fill="outline"
              color="primary"
              labelPlacement="floating"
              value={formattedCostPrice}
              onIonInput={(e) => handleCostPriceChange(e.detail.value!)}
              className="border-solid border-2 border-gray-500/25 rounded-lg ion-padding-start"
            />
          </div>
          <div className="flex-1">
            <IonLabel position="stacked">Chiết khấu (%)</IonLabel>
            <IonInput
              type="number"
              fill="outline"
              labelPlacement="floating"
              value={newDiscount}
              onIonInput={(e) =>
                handleDiscountChange(parseFloat(e.detail.value!) || 0)
              }
              min={0}
              max={100}
              className="border-solid border-2 border-gray-500/25 rounded-lg ion-padding-start"
            />
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2 border rounded-full p-1">
            <IonButton
              fill="clear"
              onClick={() => handleQuantityChange(quantity - 1)}
            >
              <IonIcon icon={remove} />
            </IonButton>
            <IonInput
              aria-label="Counter"
              className="w-8 text-center"
              type="number"
              value={quantity}
              onChange={(e) => {
                const value = e.currentTarget.value
                  ? parseInt(e.currentTarget.value.toString())
                  : 0;
                handleQuantityChange(value);
              }}
            ></IonInput>
            <IonButton
              fill="clear"
              onClick={() => handleQuantityChange(quantity + 1)}
            >
              <IonIcon icon={add} />
            </IonButton>
          </div>
          <div className="text-lg font-medium">
            {formatCurrency(quantity * newCostPrice * (1 - newDiscount / 100))}
          </div>
        </div>
      </div>
    </IonItem>
  );
};

export default ReceiptItem;
