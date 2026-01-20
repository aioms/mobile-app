import React, { useState, useEffect } from "react";
import { IonInput, IonButton, IonIcon, IonChip, useIonToast } from "@ionic/react";
import { createOutline, checkmarkOutline, closeOutline } from "ionicons/icons";

import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/helpers/formatters";
import { useLoading } from "@/hooks/useLoading";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { IEditableProductItemProps } from "../receiptDebtUpdate.d";

const EditableProductItem: React.FC<IEditableProductItemProps> = ({
  item,
  periodDate,
  isDisabled,
  onItemChange,
  onToggleEdit,
}) => {
  const [presentToast] = useIonToast();
  const { withLoading } = useLoading();
  const { updateReceiptItem } = useReceiptDebt();
  const [editValues, setEditValues] = useState({
    quantity: item.quantity.toString(),
    costPrice: formatCurrencyInput(item.costPrice.toString()),
  });
  const [errors, setErrors] = useState<{ quantity?: string; costPrice?: string }>({});

  // Reset edit values when item changes or editing is toggled
  useEffect(() => {
    if (!item.isEditing) {
      setEditValues({
        quantity: item.quantity.toString(),
        costPrice: formatCurrencyInput(item.costPrice.toString()),
      });
      setErrors({});
    }
  }, [item.isEditing, item.quantity, item.costPrice]);

  const truncateProductName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    return `${name.substring(0, maxLength)}...`;
  };

  const validateInputs = () => {
    const newErrors: { quantity?: string; costPrice?: string } = {};

    const quantity = parseInt(editValues.quantity);
    const costPrice = parseCurrencyInput(editValues.costPrice);

    if (!editValues.quantity || quantity <= 0) {
      newErrors.quantity = "Số lượng phải lớn hơn 0";
    }

    if (!editValues.costPrice || costPrice <= 0) {
      newErrors.costPrice = "Đơn giá phải lớn hơn 0";
    }

    if (quantity > 999999) {
      newErrors.quantity = "Số lượng không được vượt quá 999,999";
    }

    if (costPrice > 999999999) {
      newErrors.costPrice = "Đơn giá không được vượt quá 999,999,999";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin nhập",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    const quantity = parseInt(editValues.quantity);
    const costPrice = parseCurrencyInput(editValues.costPrice);

    await withLoading(async () => {
      try {
        await updateReceiptItem({
          receiptItemId: item.id,
          quantity,
          costPrice,
        });

        // Update local state after successful API call
        onItemChange({
          id: item.id,
          quantity,
          costPrice,
          periodDate,
        });

        onToggleEdit(item.id);

        presentToast({
          message: "Cập nhật sản phẩm thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });
      } catch (error) {
        presentToast({
          message: (error as Error).message,
          duration: 3000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  const handleCancel = () => {
    setEditValues({
      quantity: item.quantity.toString(),
      costPrice: formatCurrencyInput(item.costPrice.toString()),
    });
    setErrors({});
    onToggleEdit(item.id);
  };

  const handleQuantityChange = (value: string) => {
    // Only allow numeric input
    const numericValue = value.replace(/[^0-9]/g, "");
    setEditValues(prev => ({ ...prev, quantity: numericValue }));

    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: undefined }));
    }
  };

  const handleCostPriceChange = (value: string) => {
    const formattedValue = formatCurrencyInput(value);
    setEditValues(prev => ({ ...prev, costPrice: formattedValue }));

    if (errors.costPrice) {
      setErrors(prev => ({ ...prev, costPrice: undefined }));
    }
  };

  const totalPrice = item.isEditing
    ? parseInt(editValues.quantity || "0") * parseCurrencyInput(editValues.costPrice || "0")
    : item.costPrice * item.quantity;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Product Info */}
      <div className="mb-4">
        <h4
          className="text-md font-bold text-gray-900 mb-3"
          title={item.productName}
        >
          {truncateProductName(item.productName)}
        </h4>
        <div className="flex items-center space-x-2 text-base text-gray-600">
          <span>Mã: {item.code}</span>
        </div>
        {/* Show badge for returned items */}
        {item.returnedQuantity && item.returnedQuantity > 0 && (
          <IonChip color="warning" className="text-xs mt-2">
            Đã trả: {item.returnedQuantity}
          </IonChip>
        )}
      </div>

      {/* Quantity and Price Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-base font-semibold text-gray-600">Số lượng:</span>
          {item.isEditing ? (
            <div>
              <div className={`mt-1 border rounded-md px-3 py-2 bg-white ${errors.quantity ? 'border-red-500' : 'border-input'}`}>
                <IonInput
                  type="text"
                  value={editValues.quantity}
                  onIonInput={(e) => handleQuantityChange(e.detail.value!)}
                  className={`w-full text-base`}
                  placeholder="Nhập số lượng"
                />
              </div>
              {errors.quantity && (
                <div className="text-red-500 text-sm mt-1">{errors.quantity}</div>
              )}
            </div>
          ) : (
            <div className="text-md font-bold text-gray-900">{item.quantity}</div>
          )}
        </div>

        <div>
          <span className="text-base font-semibold text-gray-600">Đơn giá:</span>
          {item.isEditing ? (
            <div>
              <div className={`mt-1 border rounded-md px-3 py-2 bg-white ${errors.costPrice ? 'border-red-500' : 'border-input'}`}>
                <IonInput
                  type="text"
                  value={editValues.costPrice}
                  onIonInput={(e) => handleCostPriceChange(e.detail.value!)}
                  className={`w-full text-base`}
                  placeholder="Nhập đơn giá"
                />
              </div>
              {errors.costPrice && (
                <div className="text-red-500 text-sm mt-1">{errors.costPrice}</div>
              )}
            </div>
          ) : (
            <div className="text-md font-bold text-gray-900">
              {formatCurrency(item.costPrice)}
            </div>
          )}
        </div>
      </div>

      {/* Total Price */}
      <div className="mb-4 p-4 bg-white rounded-lg">
        <span className="text-lg font-semibold text-gray-600">Tổng tiền:</span>
        <div className="text-lg font-bold text-blue-600">
          {formatCurrency(totalPrice)}
        </div>
      </div>

      {/* Edit Controls - disable for returned items */}
      {!isDisabled && !(item.returnedQuantity && item.returnedQuantity > 0) && (
        <div className="flex items-center justify-center space-x-2">
          {item.isEditing ? (
            <>
              <IonButton
                size="small"
                color="success"
                fill="solid"
                onClick={handleSave}
              >
                <IonIcon icon={checkmarkOutline} slot="start" />
                Lưu
              </IonButton>
              <IonButton
                size="small"
                color="medium"
                fill="outline"
                onClick={handleCancel}
              >
                <IonIcon icon={closeOutline} slot="start" />
                Hủy
              </IonButton>
            </>
          ) : (
            <IonButton
              size="small"
              color="primary"
              fill="outline"
              onClick={() => onToggleEdit(item.id)}
            >
              <IonIcon icon={createOutline} slot="start" />
              Chỉnh sửa
            </IonButton>
          )}
        </div>
      )}

      {/* Disabled State Message */}
      {isDisabled && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Không thể chỉnh sửa do trạng thái phiếu
        </div>
      )}

      {/* Returned Item Message */}
      {(!isDisabled && item.returnedQuantity && item.returnedQuantity > 0) ? (
        <div className="text-center text-sm text-orange-500 mt-2">
          Không thể chỉnh sửa - sản phẩm đã trả hàng
        </div>
      ) : null}
    </div>
  );
};

export default EditableProductItem;