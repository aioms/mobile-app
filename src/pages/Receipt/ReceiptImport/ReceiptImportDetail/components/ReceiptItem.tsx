import { FC, memo, useEffect, useMemo, useState } from "react";
import { IonInput, IonItem, IonLabel } from "@ionic/react";

import { formatCurrency, parseCurrencyInput } from "@/helpers/formatters";

type Props = {
  id: string;
  productName: string;
  productCode: number;
  code: string;
  quantity: number;
  inventory: number;
  actualInventory: number;
  costPrice: number;
  discount: number;
  onRowChange?: (data: any) => void;
};

const ReceiptItem: FC<Props> = memo(({
  id,
  productCode,
  productName,
  code,
  quantity,
  inventory,
  actualInventory,
  costPrice,
  discount,
  onRowChange,
}) => {
  const [formattedCostPrice, setformattedCostPrice] = useState<string>(
    formatCurrency(costPrice)
  );
  const [newCostPrice, setNewCostPrice] = useState<number>(costPrice);
  const [newDiscount, setNewDiscount] = useState<number>(discount || 0);

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

  const totalPrice = useMemo(() => {
    if (typeof quantity === "number" && typeof newCostPrice === "number") {
      return quantity * newCostPrice * (1 - newDiscount / 100);
    }
    return 0;
  }, [quantity, newCostPrice, newDiscount]);

  useEffect(() => {
    if (typeof newCostPrice === "number" && typeof newDiscount === "number") {
      if (typeof quantity === "number") {
        onRowChange?.({
          id,
          productCode,
          productName,
          code,
          inventory,
          actualInventory,
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
              {/* <IonFabButton
                size="small"
                color="danger"
                onClick={() => {
                  onRemoveItem?.(id);
                }}
              >
                <IonIcon icon={trash} size="small"></IonIcon>
              </IonFabButton> */}
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
          <span className="text-sm">SL: {quantity}</span>
          <div className="text-lg font-medium">
            {formatCurrency(totalPrice)}
          </div>
        </div>
      </div>
    </IonItem>
  );
});

export default ReceiptItem;
