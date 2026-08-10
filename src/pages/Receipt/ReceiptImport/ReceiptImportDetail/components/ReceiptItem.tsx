import { FC, useEffect, useMemo, useState } from "react";
import { IonIcon, IonSpinner, useIonToast } from "@ionic/react";

import { formatCurrencyWithoutSymbol, parseCurrencyInput } from "@/helpers/formatters";
import { createOutline, checkmark, closeOutline, trashOutline } from "ionicons/icons";
import useReceiptItem from "@/hooks/apis/useReceiptItem";
import { DiscountType } from "@/common/enums";

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
  discountType?: DiscountType;
  onRowChange?: (data: any) => void;
  onDelete?: () => Promise<void> | void;
  isEmployee: boolean;
  isUserSpecial: boolean;
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
    discountType,
    onRowChange,
    onDelete,
    isEmployee,
    isUserSpecial,
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
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const { update: updateReceiptItem } = useReceiptItem();
    const [presentToast] = useIonToast();

    const [discountMode, setDiscountMode] = useState<DiscountType>(discountType || DiscountType.PERCENTAGE);
    const [formattedDiscountAmount, setFormattedDiscountAmount] = useState<string>(
      discountType === DiscountType.FIXED
        ? formatCurrencyWithoutSymbol(discount)
        : formatCurrencyWithoutSymbol((discount / 100) * costPrice)
    );
    const [discountError, setDiscountError] = useState<string>("");

    const handleCostPriceChange = (value: string | null | undefined) => {
      if (value !== null && value !== undefined) {
        const numericValue = parseCurrencyInput(value);
        if (numericValue >= 0) {
          setNewCostPrice(numericValue);
          setformattedCostPrice(formatCurrencyWithoutSymbol(numericValue));
        }
      }
    };

    const handleDiscountAmountChange = (value: string) => {
      const numericValue = parseCurrencyInput(value);
      setFormattedDiscountAmount(value); // Keep input in sync with typing
      setDiscountError("");

      if (numericValue < 0) {
        setDiscountError("Giảm giá không hợp lệ");
        return;
      }
      if (numericValue > newCostPrice) {
        setDiscountError("Giảm giá không thể lớn hơn giá nhập");
        return;
      }

      setNewDiscount(numericValue);
    };

    const handleDiscountPercentChange = (value: number | null) => {
      setDiscountError("");
      if (value !== null) {

        if (value < 0 || value > 100) {
          setDiscountError("0-100%");
          setNewDiscount(0);
        } else {
          setNewDiscount(value);
        }

      }
    };

    // Sync formatted amount display when discount mode or values change
    useEffect(() => {
      if (discountMode === DiscountType.FIXED) {
        setFormattedDiscountAmount(formatCurrencyWithoutSymbol(newDiscount));
      } else {
        // For percentage mode, show the calculated amount for display purposes
        const calculatedAmount = (newDiscount / 100) * newCostPrice;
        setFormattedDiscountAmount(formatCurrencyWithoutSymbol(calculatedAmount));
      }
    }, [newDiscount, newCostPrice, discountMode]);

    const startEditQuantity = () => {
      setEditQuantity(quantity.toString());
      setIsEditingQty(true);
    };

    const cancelEditQuantity = () => {
      setIsEditingQty(false);
    };

    const handleDelete = async () => {
      if (!onDelete || disabled || isDeleting) return;

      setIsDeleting(true);
      try {
        await onDelete();
      } finally {
        setIsDeleting(false);
      }
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
        let discountAmount = 0;

        if (discountMode === DiscountType.PERCENTAGE) {
          // Percentage discount: discount is a percentage value (0-100)
          discountAmount = (newDiscount / 100) * newCostPrice;
        } else {
          // Fixed discount: discount is an absolute amount
          discountAmount = newDiscount;
        }

        const priceAfterDiscount = newCostPrice - discountAmount;
        return Math.round(quantity * priceAfterDiscount * 100) / 100;
      }
      return 0;
    }, [quantity, newCostPrice, newDiscount, discountMode]);

    useEffect(() => {
      if (typeof newCostPrice !== "number" || typeof newDiscount !== "number" || typeof quantity !== "number") {
        return;
      }

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
        discountType: discountMode,
        totalPrice,
      });
    }, [newCostPrice, newDiscount, quantity, discountMode]);

    return (
      <div className="p-4 bg-white border-b border-gray-100 last:border-b-0 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <h3 className="font-medium text-gray-900 text-sm leading-tight">{productName}</h3>
            <p className="text-gray-500 text-xs mt-0.5">{code}</p>
          </div>
          {!disabled && onDelete && (
            <button
              className="p-1.5 -mr-1.5 -mt-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
              onClick={handleDelete}
              aria-label="Xóa sản phẩm khỏi phiếu nhập"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <IonSpinner name="dots" className="w-4 h-4 text-red-500" />
              ) : (
                <IonIcon icon={trashOutline} className="text-red-500 text-lg" />
              )}
            </button>
          )}
        </div>

        {/* Inputs Section */}
        {((isEmployee && !isUserSpecial) || disabled) ? (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Giá nhập</label>
              <div className="font-medium text-sm text-gray-900">{costPrice.toLocaleString("vi-VN")}</div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Chiết khấu (%)</label>
              <div className="font-medium text-sm text-gray-900">{newDiscount}%</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Giá nhập</label>
              <input
                type="text"
                value={formattedCostPrice}
                onChange={(e) => handleCostPriceChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                disabled={disabled}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-gray-700 block">Chiết khấu</label>
                <div className="flex bg-gray-100 rounded p-0.5">
                  <button
                    onClick={() => setDiscountMode(DiscountType.PERCENTAGE)}
                    className={`text-[10px] px-2 py-0.5 rounded leading-none ${discountMode === DiscountType.PERCENTAGE ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountMode(DiscountType.FIXED)}
                    className={`text-[10px] px-2 py-0.5 rounded leading-none ${discountMode === DiscountType.FIXED ? "bg-white shadow-sm font-medium text-gray-900" : "text-gray-500"}`}
                  >
                    $
                  </button>
                </div>
              </div>
              <div className="relative">
                {discountMode === DiscountType.PERCENTAGE ? (
                  <input
                    type="number"
                    value={newDiscount}
                    onChange={(e) => handleDiscountPercentChange(parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    className={`w-full bg-gray-50 border ${discountError ? 'border-red-500' : 'border-gray-200'} rounded-lg h-9 pl-3 pr-6 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors`}
                    disabled={disabled}
                  />
                ) : (
                  <input
                    type="text"
                    value={formattedDiscountAmount}
                    onChange={(e) => handleDiscountAmountChange(e.target.value)}
                    className={`w-full bg-gray-50 border ${discountError ? 'border-red-500' : 'border-gray-200'} rounded-lg h-9 pl-3 pr-6 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-colors`}
                    disabled={disabled}
                  />
                )}
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                  {discountMode === DiscountType.PERCENTAGE ? '%' : 'đ'}
                </span>
              </div>
              {discountError && (
                <span className="text-red-500 text-[10px] mt-0.5 block">{discountError}</span>
              )}
            </div>
          </div>
        )}

        {/* Quantity Controls and Total */}
        <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600">SL:</span>
            {!isEditingQty ? (
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm text-gray-900">{quantity}</span>
                {!disabled && (
                  <button
                    className="p-1 -m-1 text-gray-400 hover:text-blue-500 transition-colors"
                    onClick={startEditQuantity}
                    aria-label="Chỉnh sửa số lượng"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <IonSpinner name="dots" className="w-3.5 h-3.5" />
                    ) : (
                      <IonIcon icon={createOutline} className="text-sm" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editQuantity}
                  min={1}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="w-16 bg-gray-50 border border-gray-200 rounded h-7 text-center text-sm focus:outline-none focus:border-blue-500"
                  disabled={isUpdating}
                />
                <button
                  className="p-1 -m-1 text-green-500 hover:text-green-600 transition-colors"
                  onClick={saveEditQuantity}
                  aria-label="Lưu số lượng"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <IonSpinner name="dots" className="w-3.5 h-3.5" />
                  ) : (
                    <IonIcon icon={checkmark} className="text-lg" />
                  )}
                </button>
                <button
                  className="p-1 -m-1 text-gray-400 hover:text-gray-500 transition-colors"
                  onClick={cancelEditQuantity}
                  aria-label="Hủy chỉnh sửa"
                  disabled={isUpdating}
                >
                  <IonIcon icon={closeOutline} className="text-lg" />
                </button>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-bold text-sm text-blue-600">
              {formatCurrencyWithoutSymbol(totalPrice)}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ReceiptItem;
