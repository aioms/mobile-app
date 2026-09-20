import { useState, useMemo, useEffect, useRef } from "react";
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
  IonInput,
} from "@ionic/react";
import { OverlayEventDetail } from "@ionic/core";
import { useLocation, useHistory } from "react-router-dom";
import {
  checkmarkCircleOutline,
  saveOutline,
  addCircleOutline,
  trashOutline,
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
import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";

import ReturnReasonSelect from "./components/ReturnReasonSelect";
import RefundSummarySection from "./components/RefundSummarySection";
import ProductReturnItem from "./components/ProductReturnItem";
import ModalSelectReturnProduct from "./components/ModalSelectReturnProduct";
import ModalSelectExchangeProduct, {
  ExchangeProductSelection,
} from "./components/ModalSelectExchangeProduct";
import { getNumberFromStringOrThrow } from "@/helpers/common";

interface LocationState {
  refId: string;
  refType: "order" | "debt";
  customerId?: string;
  customerName?: string;
  orderTotal?: number;
  orderProducts?: Array<{
    id: string;
    productId: string;
    code: string;
    productName: string;
    quantity: number;
    price: number;
    vatRate?: number;
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
  const [exchangeProducts, setExchangeProducts] = useState<ExchangeProductSelection[]>([]);
  const exchangeProductsRef = useRef<ExchangeProductSelection[]>([]);
  exchangeProductsRef.current = exchangeProducts;

  // Modal for product selection
  const [presentModalProduct, dismissModalProduct] = useIonModal(
    ModalSelectReturnProduct,
    {
      dismiss: (data: any, role: string) => dismissModalProduct(data, role),
      orderProducts: location.state?.orderProducts || [],
      refType: location.state?.refType || "order",
    }
  );

  const [presentModalExchangeProduct, dismissModalExchangeProduct] = useIonModal(
    ModalSelectExchangeProduct,
    {
      dismiss: (data: unknown, role: string) => dismissModalExchangeProduct(data, role),
      getSelectedProducts: () => exchangeProductsRef.current,
    },
  );

  const openModalSelectProduct = () => {
    presentModalProduct({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role === "confirm" && data) {
          // Merge new products with existing ones
          setSelectedProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newProducts = data.filter(
              (p: IReceiptReturnItem) => !existingIds.has(p.id)
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

  const openModalSelectExchangeProduct = () => {
    presentModalExchangeProduct({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail<ExchangeProductSelection[]>>) => {
        const { role, data } = event.detail;
        if (role !== "confirm" || !data) return;

        setExchangeProducts((current) => {
          const currentById = new Map(current.map((item) => [item.id, item]));
          return data.map((item) => currentById.get(item.id) || item);
        });
        setErrors((current) => {
          const next = { ...current };
          delete next.exchangeProducts;
          return next;
        });
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

  const updateExchangeProduct = (id: string, field: "quantity" | "unitPrice", value: number) => {
    setExchangeProducts((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const numericValue = Number.isFinite(value) ? value : 0;
      if (field === "quantity") {
        const maxQuantity = Math.max(1, Number(item.inventory || 0));
        return {
          ...item,
          quantity: Math.min(maxQuantity, Math.max(1, numericValue)),
        };
      }
      return { ...item, unitPrice: Math.max(0, numericValue) };
    }));
  };

  const removeExchangeProduct = (id: string) => {
    setExchangeProducts((prev) => prev.filter((item) => item.id !== id));
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
      totalAmount: (() => {
        const originalGross = (location.state?.orderProducts || []).reduce(
          (sum, item) => sum + item.price * item.quantity * (1 + (item.vatRate || 0) / 100),
          0,
        );
        const selectedGross = selectedProducts.reduce(
          (sum, item) => sum + item.costPrice * item.quantity * (1 + (item.vatRate || 0) / 100),
          0,
        );
        const factor = originalGross > 0 && location.state?.orderTotal !== undefined
          ? location.state.orderTotal / originalGross
          : 1;
        return Math.round(selectedGross * factor);
      })(),
    };
  }, [selectedProducts]);

  const exchangeAmount = useMemo(
    () => exchangeProducts.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [exchangeProducts],
  );
  const exchangeDifference = exchangeAmount - totalAmount;
  const isExchange = formData.reason === "doi-san-pham";

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.refId) {
      newErrors.refId = "Thiếu thông tin đơn hàng tham chiếu";
    }

    if (selectedProducts.length === 0) {
      newErrors.products = "Vui lòng chọn ít nhất 1 sản phẩm";
    }

    if (formData.reason === "doi-san-pham" && exchangeProducts.length === 0) {
      newErrors.exchangeProducts = "Vui lòng chọn sản phẩm đổi";
    }

    if (
      formData.reason === "doi-san-pham" &&
      exchangeProducts.some((item) => item.quantity > Number(item.inventory || 0))
    ) {
      newErrors.exchangeProducts = "Số lượng sản phẩm đổi vượt quá tồn kho";
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
          metadata: {
            returnedQuantity: item.quantity,
            ...item.metadata,
          },
        })),
        paymentMethod: formData.paymentMethod,
        operationType: formData.reason === "doi-san-pham" ? "exchange" : "return",
        exchangeItems: exchangeProducts.map((item) => ({
          productId: item.id,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: item.costPrice,
        })),
        requestId: crypto.randomUUID(),
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

        {isExchange && (
          <div className="bg-card rounded-lg shadow-sm mb-4 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-md font-medium text-foreground">Sản phẩm đổi</h2>
              <IonButton fill="clear" size="small" onClick={openModalSelectExchangeProduct}>
                <IonIcon icon={addCircleOutline} slot="start" />
                Chọn sản phẩm
              </IonButton>
            </div>
            {exchangeProducts.length ? (
              exchangeProducts.map((product) => (
                <div key={product.id} className="border-t mt-3 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{product.productName}</div>
                    <IonButton
                      fill="clear"
                      color="danger"
                      size="small"
                      className="-mt-2"
                      aria-label={`Xóa ${product.productName}`}
                      onClick={() => removeExchangeProduct(product.id)}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                  <div className="text-xs text-gray-500">Mã SP: {product.code}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Tồn có thể đổi: {product.inventory}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <IonInput
                      type="number"
                      label="Số lượng"
                      labelPlacement="stacked"
                      value={product.quantity}
                      min={1}
                      max={Math.max(1, product.inventory)}
                      onIonInput={(event) => updateExchangeProduct(
                        product.id,
                        "quantity",
                        Number(event.detail.value || 0),
                      )}
                      className="border rounded px-2"
                    />
                    <IonInput
                      type="text"
                      inputMode="numeric"
                      label="Đơn giá"
                      labelPlacement="stacked"
                      value={formatCurrencyWithoutSymbol(product.unitPrice)}
                      onIonInput={(event) => updateExchangeProduct(
                        product.id,
                        "unitPrice",
                        parseCurrencyInput(event.detail.value || ""),
                      )}
                      className="border rounded px-2"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4 text-sm">
                Chưa chọn sản phẩm đổi
              </div>
            )}
            <ErrorMessage message={errors.exchangeProducts} />
            <div className="border-t mt-4 pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Giá trị trả</span><span>{formatCurrency(totalAmount)}</span></div>
              <div className="flex justify-between"><span>Giá trị đổi</span><span>{formatCurrency(exchangeAmount)}</span></div>
              <div className="flex justify-between font-semibold">
                <span>{exchangeDifference > 0 ? "Khách bù thêm" : exchangeDifference < 0 ? "Hoàn lại khách" : "Không phát sinh tiền"}</span>
                <span className={exchangeDifference < 0 ? "text-red-600" : "text-green-600"}>{formatCurrency(Math.abs(exchangeDifference))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Return Details Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">

          {/* Payment Method */}
          {(!isExchange || exchangeDifference !== 0) && <div className="p-4">
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
          </div>}

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

        </div>
      </IonContent>

      <IonFooter>
        <div className="ion-padding flex gap-2">
          {/* <IonButton
            expand="block"
            fill="outline"
            size="default"
            onClick={() => handleSubmit(ReceiptReturnStatus.DRAFT)}
            disabled={isLoading}
            className="flex-1"
          >
            <IonIcon icon={saveOutline} slot="start" />
            Lưu nháp
          </IonButton> */}
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
