import React, { useState, useEffect } from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
} from "@ionic/react";
import { ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { PaymentMethod } from "@/common/enums/payment";
import { getPaymentReceiptTypeIcon } from "../../common/utils";

export interface FilterState {
  expenseType: ReceiptPaymentExpenseType | "all";
  startDate: string;
  endDate: string;
  paymentMethod: PaymentMethod | "all";
  isDirectExport: boolean | null;
}

interface PaymentReceiptFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const expenseTypes = [
  { value: "all", label: "Tất cả" },
  { value: ReceiptPaymentExpenseType.SUPPLIER_PAYMENT, label: "Thanh toán NCC" },
  { value: ReceiptPaymentExpenseType.TRANSPORTATION, label: "Vận chuyển" },
  { value: ReceiptPaymentExpenseType.UTILITIES, label: "Điện nước" },
  { value: ReceiptPaymentExpenseType.RENT, label: "Thuê nhà/mặt bằng" },
  { value: ReceiptPaymentExpenseType.LABOR, label: "Nhân công" },
  { value: ReceiptPaymentExpenseType.CASH_WITHDRAWAL_SANG, label: "Rút tiền Cô Sang" },
  { value: ReceiptPaymentExpenseType.OTHER, label: "Khác" },
];

const paymentMethods = [
  { value: "all", label: "Tất cả" },
  { value: PaymentMethod.CASH, label: "Tiền mặt" },
  { value: PaymentMethod.BANK_TRANSFER, label: "Chuyển khoản" },
  { value: PaymentMethod.CREDIT_CARD, label: "Thẻ tín dụng" },
];

const PaymentReceiptFilterModal: React.FC<PaymentReceiptFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  currentFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleReset = () => {
    setFilters({
      expenseType: "all",
      startDate: "",
      endDate: "",
      paymentMethod: "all",
      isDirectExport: null,
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.75, 1]}
      className="filter-modal"
    >
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose} color="medium" className="text-sm font-semibold">
              Hủy
            </IonButton>
          </IonButtons>
          <IonTitle className="text-base font-bold text-gray-900 text-center">
            Bộ lọc nâng cao
          </IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleReset} color="danger" className="text-sm font-semibold">
              Thiết lập lại
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50 ion-padding">
        <div className="space-y-6 pb-10">
          {/* Expense Type Filter */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Loại chi phí
            </h3>
            <div className="flex flex-wrap gap-2">
              {expenseTypes.map((type) => {
                const isSelected = filters.expenseType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFilters({ ...filters, expenseType: type.value as any })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Thời gian thanh toán
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Filter */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Phương thức thanh toán
            </h3>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => {
                const isSelected = filters.paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    onClick={() => setFilters({ ...filters, paymentMethod: method.value as any })}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* isDirectExport Filter */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Hình thức xuất
            </h3>
            <div className="flex gap-2">
              {[
                { label: "Tất cả", value: null },
                { label: "Xuất thẳng / Chạy hàng", value: true },
                { label: "Qua kho", value: false },
              ].map((option) => {
                const isSelected = filters.isDirectExport === option.value;
                return (
                  <button
                    key={String(option.value)}
                    onClick={() => setFilters({ ...filters, isDirectExport: option.value })}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                      isSelected
                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={handleApply}
              className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl shadow-md active:bg-blue-600 active:scale-[0.99] transition-all text-sm"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PaymentReceiptFilterModal;
