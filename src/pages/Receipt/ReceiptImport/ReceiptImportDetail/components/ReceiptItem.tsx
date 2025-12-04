import { FC, useEffect, useMemo, useState } from "react";
import { IonInput, IonItem, IonLabel, IonIcon, IonSpinner, useIonToast } from "@ionic/react";

import { formatCurrencyWithoutSymbol, parseCurrencyInput } from "@/helpers/formatters";
import { createOutline, checkmark, closeOutline } from "ionicons/icons";
import useReceiptItem from "@/hooks/apis/useReceiptItem";

type Props = {
  id: string;
  productId: string;
  productName: string;
  productCode: number;
  code: string;
  quantity: number;
  inventory: number;
  actualInventory: number;
  costPrice: number;
  discount: number;
  onRowChange?: (data: any) => void;
  isEmployee: boolean;
  disabled?: boolean;
};

const ReceiptItem: FC<Props> = (
  ({
    id,
    productId,
    productCode,
    productName,
    code,
    quantity,
    inventory,
    actualInventory,
    costPrice,
    discount,
    onRowChange,
    isEmployee,
    disabled = false,
  }) => {
    const [formattedCostPrice, setformattedCostPrice] = useState<string>(
      formatCurrencyWithoutSymbol(costPrice)
    );
    const [newCostPrice, setNewCostPrice] = useState<number>(costPrice);

    const [newDiscount, setNewDiscount] = useState<number>(discount);

    const [isEditingQty, setIsEditingQty] = useState<boolean>(false);
    const [editQuantity, setEditQuantity] = useState<string>(quantity.toString());
    const [isUpdating, setIsUpdating] = useState<boolean>(false);
    const { update: updateReceiptItem } = useReceiptItem();
    const [presentToast] = useIonToast();

    const handleCostPriceChange = (value: string | null | undefined) => {
      if (value !== null && value !== undefined) {
        const numericValue = parseCurrencyInput(value);
        if (numericValue >= 0) {
          setNewCostPrice(numericValue);
          setformattedCostPrice(formatCurrencyWithoutSymbol(numericValue));
        }
      }
    };

    const handleDiscountChange = (value: number | null) => {
      if (value !== null && value >= 0 && value <= 100) {
        setNewDiscount(value);
      }
    };

    const startEditQuantity = () => {
      setEditQuantity(quantity.toString());
      setIsEditingQty(true);
    };

    const cancelEditQuantity = () => {
      setIsEditingQty(false);
    };

    const saveEditQuantity = async () => {
      const newQty = parseInt(editQuantity, 10);
      if (isNaN(newQty) || newQty <= 0) {
        await presentToast({
          message: "Số lượng phải là số dương",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return;
      }

      setIsUpdating(true);
      try {
        const newInventory = Math.max(0, (inventory ?? 0) - quantity + newQty);
        // const quantityChangeType = newQty > quantity ? "increment" : "decrement";
        // const quantityChange = Math.abs(newQty - quantity);

        await updateReceiptItem(id, {
          quantity: newQty,
          // quantityChange,
          // quantityChangeType,
          // isUpdateProductInventory: true
        });

        await presentToast({
          message: "Đã cập nhật số lượng",
          duration: 1000,
          position: "top",
          color: "success",
        });

        const updatedTotalPrice = newQty * newCostPrice * (1 - newDiscount / 100);
        onRowChange?.({
          id,
          productId,
          productCode,
          productName,
          code,
          inventory: newInventory,
          actualInventory,
          quantity: newQty,
          costPrice: newCostPrice,
          discount: newDiscount,
          totalPrice: updatedTotalPrice,
        });

        setIsEditingQty(false);
      } catch (error) {
        await presentToast({
          message: (error as Error).message || "Cập nhật thất bại",
          duration: 2500,
          position: "top",
          color: "danger",
        });
      } finally {
        setIsUpdating(false);
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
            productId,
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
        <div className="py-4 shadow-sm space-y-4 border-b-2 w-full">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-lg">{productName}</h3>
                  <p className="text-gray-500">{code}</p>
                  <div className="text-gray-500">
                    Giá nhập: {formattedCostPrice}
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
          {isEmployee || disabled ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <IonLabel position="stacked">Giá nhập</IonLabel>
                <div className="text-lg font-medium text-primary">
                  {costPrice.toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="flex-1">
                <IonLabel position="stacked">Chiết khấu (%)</IonLabel>
                <div className="text-lg font-medium text-primary">
                  {newDiscount}%
                </div>
              </div>
            </div>
          ) : (
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
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </div>
            </div>
          )}

          {/* Quantity Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              {!isEditingQty ? (
                <>
                  <span className="text-sm">SL: {quantity}</span>
                  {!disabled && (
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      onClick={startEditQuantity}
                      aria-label="Chỉnh sửa số lượng"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <IonSpinner name="dots" className="w-4 h-4" />
                      ) : (
                        <IonIcon icon={createOutline} className="text-gray-500" />
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <IonInput
                    type="number"
                    fill="outline"
                    value={editQuantity}
                    min={1}
                    onIonInput={(e) => setEditQuantity(e.detail.value!)}
                    className="w-24 border-solid border-2 border-gray-500/25 rounded-lg ion-padding-start"
                    disabled={isUpdating}
                  />
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={saveEditQuantity}
                    aria-label="Lưu số lượng"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <IonSpinner name="dots" className="w-4 h-4" />
                    ) : (
                      <IonIcon icon={checkmark} className="text-green-600" />
                    )}
                  </button>
                  <button
                    className="p-1 rounded hover:bg-gray-100"
                    onClick={cancelEditQuantity}
                    aria-label="Hủy chỉnh sửa"
                    disabled={isUpdating}
                  >
                    <IonIcon icon={closeOutline} className="text-gray-500" />
                  </button>
                </div>
              )}
            </div>
            <div className="text-lg font-medium">{formatCurrencyWithoutSymbol(totalPrice)}</div>
          </div>
        </div>
      </IonItem>
    );
  }
);

export default ReceiptItem;
