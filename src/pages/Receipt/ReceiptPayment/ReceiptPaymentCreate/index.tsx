import React, { useState } from "react";
import {
  IonPage,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonItem,
  IonInput,
  IonTextarea,
  IonLabel,
  IonIcon,
  IonFooter,
  IonCard,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonSegment,
  IonSegmentButton,
  useIonModal,
  useIonToast,
  IonCheckbox,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import clsx from "clsx";
import { ChevronDown, Save, CheckCircle } from "lucide-react";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import DatePicker from "@/components/DatePicker";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ModalSelectReceiptImport, { IReceiptImportMock } from "./components/ModalSelectReceiptImport";
import { formatCurrency, formatCurrencyInput, parseCurrencyInput } from "@/helpers/formatters";
import { ReceiptPaymentExpenseType, ReceiptPaymentStatus } from "@/common/enums/receipt";
import { PaymentMethod } from "@/common/enums/payment";
import { EXPENSE_TYPE_LABELS } from "../common/utils";
import useReceiptPayment from "@/hooks/apis/useReceiptPayment";

const initialFormData = () => ({
  paymentDate: new Date().toISOString(),
  expenseType: ReceiptPaymentExpenseType.SUPPLIER_PAYMENT,
  expenseTypeName: "",
  supplier: "", // format: id__name
  subjectName: "",
  amount: "", // string to handle empty input
  paymentMethod: PaymentMethod.CASH,
  note: "",
  selectedReceiptImports: [] as IReceiptImportMock[],
  isDirectExport: false,
});

const ReceiptPaymentCreate: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { create } = useReceiptPayment();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearErrors = (key: string) => {
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // OPEN MODAL SELECT SUPPLIERS
  const [presentModalSupplier, dismissModalSupplier] = useIonModal(ModalSelectSupplier, {
    dismiss: (data: string, role: string) => dismissModalSupplier(data, role),
  });

  const openModalSelectSupplier = () => {
    presentModalSupplier({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;
        if (role !== "confirm") return;

        setFormData((prev) => ({
          ...prev,
          supplier: data,
          // Reset selected receipts when supplier changes
          selectedReceiptImports: prev.supplier !== data ? [] : prev.selectedReceiptImports,
          amount: prev.supplier !== data ? "" : prev.amount
        }));
        clearErrors("supplier");
      },
    });
  };

  // OPEN MODAL SELECT RECEIPT IMPORTS
  const [presentModalReceipts, dismissModalReceipts] = useIonModal(ModalSelectReceiptImport, {
    dismiss: (data: IReceiptImportMock[], role: string) => dismissModalReceipts(data, role),
    supplierId: formData.supplier ? formData.supplier.split("__")[0] : "",
    initialSelectedIds: formData.selectedReceiptImports.map(r => r.id),
  });

  const openModalSelectReceipts = () => {
    if (!formData.supplier) {
      presentToast({ message: "Vui lòng chọn nhà cung cấp trước", color: "warning", duration: 2000 });
      return;
    }
    presentModalReceipts({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;
        if (role === "confirm" && data) {
          const selectedReceipts = data as IReceiptImportMock[];
          const totalAmount = selectedReceipts.reduce((sum, r) => sum + r.totalAmount, 0);
          setFormData((prev) => ({
            ...prev,
            selectedReceiptImports: selectedReceipts,
            amount: totalAmount.toString()
          }));
          clearErrors("amount");
          clearErrors("receipts");
        }
      },
    });
  };

  const isSupplierPayment = formData.expenseType === ReceiptPaymentExpenseType.SUPPLIER_PAYMENT;
  const isMultipleReceipts = isSupplierPayment && !formData.isDirectExport && formData.selectedReceiptImports.length > 1;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.paymentDate) newErrors.paymentDate = "Vui lòng chọn ngày chi";

    if (formData.expenseType === ReceiptPaymentExpenseType.OTHER && !formData.expenseTypeName.trim()) {
      newErrors.expenseTypeName = "Vui lòng nhập tên loại chi phí tùy chỉnh";
    }

    if (isSupplierPayment) {
      if (!formData.supplier) newErrors.supplier = "Vui lòng chọn nhà cung cấp";
      if (!formData.isDirectExport && formData.selectedReceiptImports.length === 0) newErrors.receipts = "Vui lòng chọn phiếu nhập cần thanh toán";
    } else {
      if (!formData.subjectName.trim()) newErrors.subjectName = "Vui lòng nhập tên người nhận";
    }

    if (!formData.amount || parseCurrencyInput(formData.amount) <= 0) {
      newErrors.amount = "Số tiền chi phải lớn hơn 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (type: "draft" | "active") => {
    if (isSubmitting) return;
    if (!validateForm()) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin bắt buộc",
        color: "danger",
        duration: 2000,
        position: "top"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: any = {
        paymentDate: formData.paymentDate,
        expenseType: formData.expenseType,
        paymentObject: isSupplierPayment
          ? (formData.supplier ? formData.supplier.split("__")[1] : "")
          : formData.subjectName,
        amount: parseCurrencyInput(formData.amount),
        paymentMethod: formData.paymentMethod,
        notes: formData.note,
        status: type === "draft" ? ReceiptPaymentStatus.DRAFT : ReceiptPaymentStatus.PAID,
        isDirectExport: isSupplierPayment ? formData.isDirectExport : undefined,
      };

      if (formData.expenseType === ReceiptPaymentExpenseType.OTHER) {
        submitData.expenseTypeName = formData.expenseTypeName;
      }

      if (isSupplierPayment) {
        submitData.supplierId = formData.supplier ? formData.supplier.split("__")[0] : null;
        if (!formData.isDirectExport) {
          submitData.receiptImportIds = formData.selectedReceiptImports.map(r => r.id);
        }
      }

      const response = await create(submitData);

      if (response && response.id) {
        presentToast({
          message: type === "draft" ? "Đã lưu nháp phiếu chi" : "Tạo phiếu chi thành công",
          color: "success",
          duration: 2000,
          position: "top"
        });
        history.goBack();
      } else {
        throw new Error("Không lấy được kết quả từ API");
      }
    } catch (err) {
      presentToast({
        message: "Lỗi: " + (err as Error).message,
        color: "danger",
        duration: 2000,
        position: "top"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended/payment-receipts" />
          </IonButtons>
          <IonTitle>Tạo phiếu chi</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-gray-50">
        <IonCard className="mx-0 mt-2 shadow-sm rounded-xl mb-4">
          <IonCardContent className="p-0">
            {/* Ngày chi */}
            <IonItem className={clsx("py-1", errors.paymentDate ? "ion-invalid" : "")} lines="full">
              <div className="flex flex-col w-full py-1">
                <span className="text-sm text-gray-500 font-medium mb-2">Ngày chi *</span>
                <DatePicker
                  attrs={{ id: "paymentDate" }}
                  value={formData.paymentDate}
                  presentation="date"
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, paymentDate: e.detail.value! as string }));
                    clearErrors("paymentDate");
                  }}
                />
              </div>
              {errors.paymentDate && <IonNote slot="error">{errors.paymentDate}</IonNote>}
            </IonItem>

            {/* Loại chi phí */}
            <IonItem className="py-1" lines="full">
              <div className="flex flex-col w-full py-1">
                <span className="text-sm text-gray-500 font-medium mb-1">Loại chi phí *</span>
                <IonSelect
                  interface="action-sheet"
                  value={formData.expenseType}
                  cancelText="Hủy"
                  onIonChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      expenseType: e.detail.value,
                      expenseTypeName: "",
                      supplier: "",
                      selectedReceiptImports: [],
                      subjectName: "",
                      amount: ""
                    }));
                    setErrors({});
                  }}
                  className="w-full min-h-[40px]"
                >
                  {Object.values(ReceiptPaymentExpenseType).map((type) => (
                    <IonSelectOption key={type} value={type}>
                      {EXPENSE_TYPE_LABELS[type]}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </IonItem>

            {/* Tên loại chi phí tùy chỉnh (chỉ khi chọn Khác) */}
            {formData.expenseType === ReceiptPaymentExpenseType.OTHER && (
              <IonItem className={clsx("py-1", errors.expenseTypeName ? "ion-invalid" : "")} lines="full">
                <div className="flex flex-col w-full py-1">
                  <span className="text-sm text-gray-500 font-medium mb-1">Tên loại chi phí tùy chỉnh *</span>
                  <IonInput
                    value={formData.expenseTypeName}
                    placeholder="Nhập tên loại chi phí tùy chỉnh"
                    onIonInput={(e) => {
                      setFormData(prev => ({ ...prev, expenseTypeName: e.detail.value! as string }));
                      clearErrors("expenseTypeName");
                    }}
                    className="w-full"
                  />
                </div>
                {errors.expenseTypeName && <IonNote slot="error">{errors.expenseTypeName}</IonNote>}
              </IonItem>
            )}

            {/* Đối tượng chi */}
            {isSupplierPayment ? (
              <>
                <IonItem
                  button
                  detail={false}
                  onClick={openModalSelectSupplier}
                  className={clsx("py-1", errors.supplier ? "ion-invalid" : "")}
                  lines="full"
                >
                  <div className="flex flex-col w-full py-1">
                    <span className="text-sm text-gray-500 font-medium mb-1">Nhà cung cấp *</span>
                    <div className="w-full py-2 flex items-center justify-between">
                      <span className={formData.supplier ? "text-gray-900" : "text-gray-400"}>
                        {formData.supplier ? formData.supplier.split("__")[1] : "Chọn nhà cung cấp"}
                      </span>
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  {errors.supplier && <IonNote slot="error">{errors.supplier}</IonNote>}
                </IonItem>

                <IonItem lines="full" className="py-2">
                  <div className="w-full flex">
                    <IonCheckbox
                      checked={formData.isDirectExport}
                      onIonChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          isDirectExport: e.detail.checked,
                          selectedReceiptImports: e.detail.checked ? [] : prev.selectedReceiptImports,
                          amount: e.detail.checked && prev.selectedReceiptImports.length > 0 ? "" : prev.amount
                        }));
                        clearErrors("receipts");
                      }}
                      labelPlacement="end"
                      justify="start"
                      className="w-full"
                    >
                      <span className="text-sm font-medium ml-2 whitespace-normal leading-tight">Chạy hàng/Xuất thẳng (Không có Phiếu Nhập)</span>
                    </IonCheckbox>
                  </div>
                </IonItem>

                {!formData.isDirectExport && (
                  <IonItem
                    button
                    detail={false}
                    onClick={openModalSelectReceipts}
                    className={clsx("py-1", errors.receipts ? "ion-invalid" : "")}
                    lines="full"
                    disabled={!formData.supplier}
                  >
                    <div className="flex flex-col w-full py-1">
                      <span className="text-sm text-gray-500 font-medium mb-1">Phiếu nhập cần thanh toán *</span>
                      <div className="w-full py-2 flex items-center justify-between">
                        <span className={formData.selectedReceiptImports.length ? "text-gray-900 font-medium" : "text-gray-400"}>
                          {formData.selectedReceiptImports.length > 0
                            ? `Đã chọn ${formData.selectedReceiptImports.length} phiếu`
                            : "Chọn phiếu nhập"}
                        </span>
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {errors.receipts && <IonNote slot="error">{errors.receipts}</IonNote>}
                  </IonItem>
                )}
              </>
            ) : (
              <IonItem className={clsx("py-1", errors.subjectName ? "ion-invalid" : "")} lines="full">
                <div className="flex flex-col w-full py-1">
                  <span className="text-sm text-gray-500 font-medium mb-1">Tên người nhận *</span>
                  <IonInput
                    value={formData.subjectName}
                    placeholder="Nhập tên người nhận"
                    onIonInput={(e) => {
                      setFormData(prev => ({ ...prev, subjectName: e.detail.value! as string }));
                      clearErrors("subjectName");
                    }}
                    className="w-full"
                  />
                </div>
                {errors.subjectName && <IonNote slot="error">{errors.subjectName}</IonNote>}
              </IonItem>
            )}

            {/* Số tiền chi */}
            <IonItem className={clsx("py-1", errors.amount ? "ion-invalid" : "")} lines="full">
              <div className="flex flex-col w-full py-1">
                <div className="flex justify-between w-full mb-1">
                  <span className="text-sm text-gray-500 font-medium">Số tiền chi *</span>
                  {isMultipleReceipts && <span className="text-xs text-blue-500 font-normal">(Tự động tính)</span>}
                </div>
                <IonInput
                  type="text"
                  value={formData.amount ? formatCurrencyInput(formData.amount) : ""}
                  placeholder="0"
                  readonly={isMultipleReceipts}
                  onIonInput={(e) => {
                    const rawValue = e.detail.value! as string;
                    setFormData(prev => ({ ...prev, amount: parseCurrencyInput(rawValue).toString() }));
                    clearErrors("amount");
                  }}
                  className={clsx("text-lg font-bold text-red-600 w-full", isMultipleReceipts && "opacity-70")}
                />
              </div>
              {errors.amount && <IonNote slot="error">{errors.amount}</IonNote>}
            </IonItem>

            {/* Hình thức thanh toán */}
            <IonItem className="py-2" lines="full">
              <div className="flex flex-col w-full py-1">
                <span className="text-sm text-gray-500 font-medium mb-3">Hình thức thanh toán</span>
                <IonSegment
                  value={formData.paymentMethod.toString()}
                  onIonChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: Number(e.detail.value) as PaymentMethod }))}
                  className="w-full"
                >
                  <IonSegmentButton value={PaymentMethod.CASH.toString()}>
                    <IonLabel>Tiền mặt</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value={PaymentMethod.BANK_TRANSFER.toString()}>
                    <IonLabel>Chuyển khoản</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>
            </IonItem>

            {/* Ghi chú */}
            <IonItem className="py-1" lines="none">
              <div className="flex flex-col w-full py-1">
                <span className="text-sm text-gray-500 font-medium mb-2">Ghi chú</span>
                <IonTextarea
                  rows={3}
                  placeholder="Nhập ghi chú (không bắt buộc)"
                  value={formData.note}
                  onIonInput={(e) => setFormData(prev => ({ ...prev, note: e.detail.value! as string }))}
                  className="bg-gray-50 rounded-lg p-2 border border-gray-100 w-full"
                />
              </div>
            </IonItem>
          </IonCardContent>
        </IonCard>
      </IonContent>

      <IonFooter className="bg-white">
        <div className="p-4 border-t border-gray-100">
          <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-gray-600 font-medium">Tổng tiền chi:</span>
            <span className="text-xl font-bold text-red-600">
              {formatCurrency(parseCurrencyInput(formData.amount))}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={isSubmitting}
              onClick={() => handleSubmit("draft")}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold bg-blue-50/50 active:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              Lưu tạm
            </button>
            <button
              disabled={isSubmitting}
              onClick={() => handleSubmit("active")}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-semibold shadow-sm active:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={20} />
              Tạo phiếu
            </button>
          </div>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ReceiptPaymentCreate;

