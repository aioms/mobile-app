import React, { useState } from "react";
import { IonButton, IonIcon, IonInput, useIonToast } from "@ionic/react";
import {
  checkmarkOutline,
  closeOutline,
  createOutline,
} from "ionicons/icons";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getDate } from "@/helpers/date";
import {
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/helpers/formatters";
import { RECEIPT_DEBT_STATUS } from "@/common/constants/receipt-debt.constant";
import { useLoading } from "@/hooks/useLoading";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import {
  IEnhancedPurchasePeriodListProps,
  IItemChangeData,
} from "../receiptDebtUpdate.d";
import EditableProductItem from "./EditableProductItem";

const EnhancedPurchasePeriodList: React.FC<IEnhancedPurchasePeriodListProps> = ({
  items = {},
  periods = {},
  debtId,
  receiptStatus,
  onItemsChange,
  onDiscountChange,
  onVatChange,
  calculations,
}) => {
  // State to track current item index for each period
  const [currentItemIndexes, setCurrentItemIndexes] = useState<
    Record<string, number>
  >({});
  const [editingAmountsPeriod, setEditingAmountsPeriod] = useState<string | null>(null);
  const [discountDisplayValues, setDiscountDisplayValues] = useState<
    Record<string, string>
  >({});
  const [vatDisplayValues, setVatDisplayValues] = useState<
    Record<string, string>
  >({});

  const [presentToast] = useIonToast();
  const { withLoading } = useLoading();
  const { updateReceiptPeriod } = useReceiptDebt();

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(items).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Get all items as a flat array for counting
  const allItems = Object.values(items).flat();

  // Check if editing is disabled based on receipt status
  const isEditingDisabled =
    receiptStatus === RECEIPT_DEBT_STATUS.CANCELLED ||
    receiptStatus === RECEIPT_DEBT_STATUS.COMPLETED;

  // Handle navigation for a specific period
  const handleNavigation = (periodDate: string, direction: "prev" | "next") => {
    const periodItems = items[periodDate];
    if (!periodItems || periodItems.length <= 1) return;

    const currentIndex = currentItemIndexes[periodDate] || 0;
    let newIndex = currentIndex;

    if (direction === "prev" && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (
      direction === "next" &&
      currentIndex < periodItems.length - 1
    ) {
      newIndex = currentIndex + 1;
    }

    setCurrentItemIndexes((prev) => ({
      ...prev,
      [periodDate]: newIndex,
    }));
  };

  // Handle item changes
  const handleItemChange = (changeData: IItemChangeData) => {
    const updatedItems = { ...items };
    const periodItems = updatedItems[changeData.periodDate];

    if (periodItems) {
      const itemIndex = periodItems.findIndex(
        (item) => item.id === changeData.id
      );
      if (itemIndex !== -1) {
        updatedItems[changeData.periodDate][itemIndex] = {
          ...periodItems[itemIndex],
          quantity: changeData.quantity,
          costPrice: changeData.costPrice,
          hasChanges: true,
        };
      }
    }

    onItemsChange(updatedItems);
  };

  // Handle toggle edit mode
  const handleToggleEdit = (itemId: string) => {
    const updatedItems = { ...items };

    // Find and toggle the item's editing state
    Object.keys(updatedItems).forEach((periodDate) => {
      const itemIndex = updatedItems[periodDate].findIndex(
        (item) => item.id === itemId
      );
      if (itemIndex !== -1) {
        updatedItems[periodDate][itemIndex] = {
          ...updatedItems[periodDate][itemIndex],
          isEditing: !updatedItems[periodDate][itemIndex].isEditing,
        };
      }
    });

    onItemsChange(updatedItems);
  };

  const startEditAmounts = (periodDate: string) => {
    const currentDiscount = periods[periodDate]?.discountAmount || 0;
    const currentVat = periods[periodDate]?.vatAmount || 0;
    setDiscountDisplayValues((prev) => ({
      ...prev,
      [periodDate]:
        currentDiscount > 0
          ? formatCurrencyInput(String(currentDiscount))
          : "",
    }));
    setVatDisplayValues((prev) => ({
      ...prev,
      [periodDate]:
        currentVat > 0 ? formatCurrencyInput(String(currentVat)) : "",
    }));
    setEditingAmountsPeriod(periodDate);
  };

  const cancelEditAmounts = () => {
    setEditingAmountsPeriod(null);
  };

  const handleDiscountInputChange = (periodDate: string, value: string) => {
    const parsed = parseCurrencyInput(value);
    setDiscountDisplayValues((prev) => ({
      ...prev,
      [periodDate]: parsed === 0 ? "" : formatCurrencyInput(value),
    }));
  };

  const handleVatInputChange = (periodDate: string, value: string) => {
    const parsed = parseCurrencyInput(value);
    setVatDisplayValues((prev) => ({
      ...prev,
      [periodDate]: parsed === 0 ? "" : formatCurrencyInput(value),
    }));
  };

  const saveAmounts = async (periodDate: string) => {
    const periodId = periods[periodDate]?.id;
    if (!periodId) {
      presentToast({
        message: "Không tìm thấy thông tin đợt thu",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    const discountAmount = parseCurrencyInput(
      discountDisplayValues[periodDate] || "",
    );
    const vatAmount = parseCurrencyInput(vatDisplayValues[periodDate] || "");

    const periodSubtotal = calculations.periodTotals[periodDate]?.amount || 0;
    if (discountAmount > periodSubtotal) {
      presentToast({
        message: "Chiết khấu không được lớn hơn tổng tiền hàng của đợt thu",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    await withLoading(async () => {
      try {
        await updateReceiptPeriod(debtId, periodId, {
          discountAmount,
          vatAmount,
        });
        onDiscountChange(periodDate, discountAmount);
        onVatChange(periodDate, vatAmount);
        setEditingAmountsPeriod(null);
        presentToast({
          message: "Cập nhật chiết khấu và VAT thành công",
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

  if (allItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-3">
        <h2 className="text-xl font-bold text-foreground mt-2 px-4 pt-4">
          Sản phẩm
        </h2>
        <div className="p-4 text-center text-gray-500 text-base">
          Chưa có sản phẩm nào
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-3">
      <h2 className="text-xl font-bold text-foreground mt-2 px-4 pt-4">
        Sản phẩm
      </h2>

      <div className="divide-y divide-gray-100">
        {sortedDates.map((date) => {
          const dateItems = items[date];
          const currentIndex = currentItemIndexes[date] || 0;
          const currentItem = dateItems[currentIndex];
          const formattedDate = getDate(date).format("DD/MM/YYYY");
          const periodTotal = calculations.periodTotals[date];
          const isEditingAmounts = editingAmountsPeriod === date;
          const periodDiscount = periodTotal?.discountAmount || 0;
          const periodVat = periodTotal?.vatAmount || 0;

          return (
            <div key={date} className="p-4">
              {/* Period Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-600">
                    Đợt thu {formattedDate}
                  </h3>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(periodTotal?.totalWithVat || 0)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">
                    {dateItems.length} sản phẩm •{" "}
                    {periodTotal?.quantity || 0} tổng số lượng
                  </p>
                  <p className="text-xs text-gray-400">
                    Tổng đợt thu (sau CK, gồm VAT)
                  </p>
                </div>

                {/* Discount and VAT per period */}
                <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-gray-800">
                      Chiết khấu và VAT
                    </span>
                    {!isEditingDisabled && !isEditingAmounts && (
                      <IonButton
                        size="small"
                        fill="clear"
                        className="text-blue-600 font-semibold"
                        onClick={() => startEditAmounts(date)}
                      >
                        <IonIcon icon={createOutline} slot="start" />
                        Sửa
                      </IonButton>
                    )}
                  </div>

                  {isEditingAmounts ? (
                    <div className="mt-2">
                      <label className="text-sm font-medium text-gray-600">
                        Chiết khấu
                      </label>
                      <div className="border border-gray-300 rounded-lg px-3 py-2 bg-white mt-1 mb-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <IonInput
                          type="text"
                          inputMode="numeric"
                          value={discountDisplayValues[date] || ""}
                          placeholder="Nhập số tiền chiết khấu"
                          className="text-base font-semibold text-gray-900"
                          onIonInput={(e) =>
                            handleDiscountInputChange(
                              date,
                              e.detail.value || "",
                            )
                          }
                        />
                      </div>
                      <label className="text-sm font-medium text-gray-600">
                        VAT đợt thu
                      </label>
                      <div className="border border-gray-300 rounded-lg px-3 py-2 bg-white mb-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                        <IonInput
                          type="text"
                          inputMode="numeric"
                          value={vatDisplayValues[date] || ""}
                          placeholder="Nhập số tiền VAT"
                          className="text-base font-semibold text-gray-900"
                          onIonInput={(e) =>
                            handleVatInputChange(date, e.detail.value || "")
                          }
                        />
                      </div>
                      <div className="flex items-center justify-center space-x-3 mt-3">
                        <IonButton
                          size="default"
                          color="medium"
                          fill="outline"
                          className="flex-1 max-w-[130px] font-semibold"
                          onClick={cancelEditAmounts}
                        >
                          <IonIcon icon={closeOutline} slot="start" />
                          Hủy
                        </IonButton>
                        <IonButton
                          size="default"
                          color="success"
                          fill="solid"
                          className="flex-1 max-w-[130px] font-semibold"
                          onClick={() => saveAmounts(date)}
                        >
                          <IonIcon icon={checkmarkOutline} slot="start" />
                          Lưu
                        </IonButton>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mb-1">
                      <div className="flex justify-between text-base font-semibold text-gray-800">
                        <span>Chiết khấu</span>
                        <span>
                          {periodDiscount > 0 ? "-" : ""}
                          {formatCurrency(periodDiscount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-semibold text-gray-800">
                        <span>VAT đợt thu</span>
                        <span>{formatCurrency(periodVat)}</span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm font-medium text-gray-500 mt-2">
                    Tiền hàng: {formatCurrency(periodTotal?.amount || 0)}
                  </div>
                </div>
              </div>

              {/* Current Item Display */}
              <div className="mb-4">
                <EditableProductItem
                  item={currentItem}
                  periodDate={date}
                  debtId={debtId}
                  isDisabled={isEditingDisabled}
                  onItemChange={handleItemChange}
                  onToggleEdit={handleToggleEdit}
                />
              </div>

              {/* Navigation Controls */}
              {dateItems.length > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleNavigation(date, "prev")}
                    disabled={currentIndex === 0}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      currentIndex === 0
                        ? "text-gray-300 cursor-not-allowed bg-gray-100"
                        : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-gray-700">
                      {currentIndex + 1} / {dateItems.length}
                    </span>
                  </div>

                  <button
                    onClick={() => handleNavigation(date, "next")}
                    disabled={currentIndex === dateItems.length - 1}
                    className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                      currentIndex === dateItems.length - 1
                        ? "text-gray-300 cursor-not-allowed bg-gray-100"
                        : "text-gray-600 hover:bg-gray-200 active:bg-gray-300 bg-white shadow-sm"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grand Total Section */}
      {allItems.length > 0 && (
        <div className="px-4 py-4 bg-blue-50 border-t border-blue-100 mt-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-blue-800">
                Tổng tất cả đợt thu
              </h3>
              <p className="text-base text-blue-600 mt-1">
                {sortedDates.length} đợt thu • {calculations.totalQuantity} sản phẩm
                <br/>
                {calculations.totalVatAmount > 0
                  ? `VAT ${formatCurrency(calculations.totalVatAmount)}`
                  : ""}
                {calculations.totalDiscountAmount > 0
                  ? ` • Chiết khấu ${formatCurrency(calculations.totalDiscountAmount)}`
                  : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-800">
                {formatCurrency(calculations.totalAmount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Warning */}
      {isEditingDisabled && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100">
          <div className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Không thể chỉnh sửa sản phẩm do trạng thái
            phiếu hiện tại.
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPurchasePeriodList;
