import { useState, useMemo, useEffect } from "react";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonTextarea,
  IonFooter,
  useIonModal,
  useIonToast,
  IonRadioGroup,
  IonRadio,
  IonItem,
} from "@ionic/react";
import { OverlayEventDetail } from "@ionic/core";
import { useLocation, useHistory } from "react-router-dom";
import {
  checkmarkCircleOutline,
  saveOutline,
  addCircleOutline,
} from "ionicons/icons";

import { useLoading } from "@/hooks";
import useReceiptReturn from "@/hooks/apis/useReceiptReturn";
import DatePicker from "@/components/DatePicker";
import ErrorMessage from "@/components/ErrorMessage";

import {
  IReceiptReturnFormData,
  IReceiptReturnItem,
  ReceiptReturnType,
  ReceiptReturnStatus,
  CreateReceiptReturnRequestDto,
} from "@/types/receipt-return.type";
import { PaymentMethod } from "@/common/enums/payment";
import { getDate } from "@/helpers/date";
import { cn } from "@/lib/utils";

import ReturnReasonSelect from "./components/ReturnReasonSelect";
import RefundSummarySection from "./components/RefundSummarySection";
import ProductReturnItem from "./components/ProductReturnItem";
import ModalSelectReturnProduct from "./components/ModalSelectReturnProduct";
import { getNumberFromStringOrThrow } from "@/helpers/common";

interface LocationState {
  refId: string;
  refType: "order" | "debt";
  customerId?: string;
  customerName?: string;
  orderProducts?: Array<{
    id: string;
    productId: string;
    code: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

const ReceiptReturn: React.FC = () => {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const [presentToast] = useIonToast();

  const { isLoading, withLoading } = useLoading();
  const { create: createReceiptReturn } = useReceiptReturn();

  const [formData, setFormData] = useState<IReceiptReturnFormData>({
    note: "",
    reason: "khac",
    type: ReceiptReturnType.CUSTOMER,
    returnDate: getDate(new Date()).format(),
    refId: location.state?.refId || "",
    refType: location.state?.refType || "order",
    customer: location.state?.customerId,
    items: [],
    paymentMethod: PaymentMethod.CASH,
  });

  const [customerName, setCustomerName] = useState<string>(
    location.state?.customerName || "Khách lẻ"
  );
  const [selectedProducts, setSelectedProducts] = useState<IReceiptReturnItem[]>(
    []
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modal for product selection
  const [presentModalProduct, dismissModalProduct] = useIonModal(
    ModalSelectReturnProduct,
    {
      dismiss: (data: any, role: string) => dismissModalProduct(data, role),
      orderProducts: location.state?.orderProducts || [],
    }
  );

  const openModalSelectProduct = () => {
    presentModalProduct({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role === "confirm" && data) {
          // Merge new products with existing ones
          setSelectedProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.productId));
            const newProducts = data.filter(
              (p: IReceiptReturnItem) => !existingIds.has(p.productId)
            );
            return [...prev, ...newProducts];
          });

          // Clear error if products are selected
          if (errors.products) {
            setErrors((prev) => {
              const newErrors = { ...prev };
              delete newErrors.products;
              return newErrors;
            });
          }
        }
      },
    });
  };

  const handleProductQuantityChange = (id: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user updates field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Calculate totals
  const { totalProduct, totalQuantity, totalAmount } = useMemo(() => {
    return {
      totalProduct: selectedProducts.length,
      totalQuantity: selectedProducts.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalAmount: selectedProducts.reduce(
        (sum, item) => sum + item.costPrice * item.quantity,
        0
      ),
    };
  }, [selectedProducts]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.refId) {
      newErrors.refId = "Thiếu thông tin đơn hàng tham chiếu";
    }

    if (selectedProducts.length === 0) {
      newErrors.products = "Vui lòng chọn ít nhất 1 sản phẩm";
    }

    if (!formData.reason) {
      newErrors.reason = "Vui lòng chọn lý do trả hàng";
    }

    if (!formData.returnDate) {
      newErrors.returnDate = "Vui lòng chọn ngày trả hàng";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: ReceiptReturnStatus) => {
    const isValid = validateForm();

    if (!isValid) {
      await presentToast({
        message: "Vui lòng kiểm tra lại thông tin phiếu trả hàng",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    await withLoading(async () => {
      const submissionData: CreateReceiptReturnRequestDto = {
        note: formData.note,
        totalQuantity,
        totalProduct,
        totalAmount,
        reason: formData.reason,
        type: ReceiptReturnType.CUSTOMER,
        status,
        returnDate: formData.returnDate,
        refId: formData.refId,
        refType: formData.refType,
        customer: formData.customer,
        items: selectedProducts.map((item) => ({
          id: item.id,
          productId: item.productId,
          productCode: getNumberFromStringOrThrow(item.code),
          productName: item.productName,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
        paymentMethod: formData.paymentMethod,
      };

      await createReceiptReturn(submissionData)

      await presentToast({
        message:
          status === ReceiptReturnStatus.DRAFT
            ? "Lưu nháp phiếu trả hàng thành công"
            : "Tạo phiếu trả hàng thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });

      history.goBack();
    });
  };

  // Validate that we have necessary data from navigation
  useEffect(() => {
    if (!location.state?.refId) {
      presentToast({
        message: "Thiếu thông tin đơn hàng. Vui lòng thử lại.",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      history.goBack();
    }
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/orders" />
          </IonButtons>
          <IonTitle>Tạo phiếu trả hàng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-background">
        {/* Customer Information Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Khách hàng
            </h2>
            <div className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {customerName}
            </div>
          </div>
        </div>

        {/* Product Selection Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-md font-medium text-foreground">
                Sản phẩm trả
              </h2>
              <IonButton
                fill="clear"
                size="small"
                onClick={openModalSelectProduct}
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Chọn sản phẩm
              </IonButton>
            </div>

            <ErrorMessage message={errors.products} />

            {selectedProducts.length > 0 ? (
              <div className="mt-2">
                {selectedProducts.map((product) => (
                  <ProductReturnItem
                    key={product.id}
                    id={product.id}
                    productName={product.productName}
                    code={product.code}
                    quantity={product.quantity}
                    costPrice={product.costPrice}
                    originalQuantity={product.originalQuantity}
                    onQuantityChange={handleProductQuantityChange}
                    onRemove={handleRemoveProduct}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4 text-sm">
                Chưa chọn sản phẩm nào
              </div>
            )}
          </div>
        </div>

        {/* Refund Summary */}
        {selectedProducts.length > 0 && (
          <div className="mb-4">
            <RefundSummarySection
              totalProduct={totalProduct}
              totalQuantity={totalQuantity}
              totalAmount={totalAmount}
            />
          </div>
        )}

        {/* Return Details Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          {/* Return Reason */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Lý do trả hàng
            </h2>
            <ReturnReasonSelect
              value={formData.reason}
              onChange={(value) => handleFormChange("reason", value)}
              error={errors.reason}
            />
          </div>

          {/* Return Date */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Ngày trả hàng
            </h2>
            <DatePicker
              value={formData.returnDate}
              presentation="date"
              onChange={(e) => handleFormChange("returnDate", e.detail.value)}
              attrs={{ id: "return-date" }}
              extraClassName="w-full flex items-center justify-start"
            />
            <ErrorMessage message={errors.returnDate} />
          </div>

          {/* Notes */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Ghi chú
            </h2>
            <IonTextarea
              name="note"
              value={formData.note}
              onIonInput={(e) => handleFormChange("note", e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
              maxlength={500}
              className="border border-input rounded-lg px-2"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formData.note.length}/500
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-3">
              Phương thức thanh toán
            </h2>
            <IonRadioGroup
              value={formData.paymentMethod}
              onIonChange={(e) => handleFormChange("paymentMethod", e.detail.value)}
            >
              <div className="flex gap-4">
                <IonItem
                  lines="none"
                  className={cn(`rounded-lg transition-colors`, {
                    "bg-custom-primary border border-custom-primary":
                      formData.paymentMethod === PaymentMethod.CASH,
                    border: formData.paymentMethod === PaymentMethod.BANK_TRANSFER,
                  })}
                >
                  <IonRadio value={PaymentMethod.CASH}>Tiền mặt</IonRadio>
                </IonItem>
                <IonItem
                  lines="none"
                  className={cn(`rounded-lg transition-colors`, {
                    "bg-custom-primary border border-custom-primary":
                      formData.paymentMethod === PaymentMethod.BANK_TRANSFER,
                    border: formData.paymentMethod === PaymentMethod.CASH,
                  })}
                >
                  <IonRadio value={PaymentMethod.BANK_TRANSFER}>Chuyển khoản</IonRadio>
                </IonItem>
              </div>
            </IonRadioGroup>
          </div>
        </div>
      </IonContent>

      <IonFooter>
        <div className="ion-padding flex gap-2">
          <IonButton
            expand="block"
            fill="outline"
            size="default"
            onClick={() => handleSubmit(ReceiptReturnStatus.DRAFT)}
            disabled={isLoading}
            className="flex-1"
          >
            <IonIcon icon={saveOutline} slot="start" />
            Lưu nháp
          </IonButton>
          <IonButton
            expand="block"
            size="default"
            onClick={() => handleSubmit(ReceiptReturnStatus.COMPLETED)}
            disabled={isLoading}
            className="flex-1"
          >
            <IonIcon icon={checkmarkCircleOutline} slot="start" />
            Xác nhận
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default ReceiptReturn;
