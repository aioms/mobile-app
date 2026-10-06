import { useMemo, useRef, useState } from "react";
import { useIonModal, useIonToast, useIonViewWillEnter } from "@ionic/react";
import { OverlayEventDetail } from "@ionic/core";
import { useHistory, useLocation } from "react-router-dom";
import { useLoading } from "@/hooks";
import useReceiptReturn from "@/hooks/apis/useReceiptReturn";
import {
  CreateReceiptReturnRequestDto,
  IReceiptReturnFormData,
  IReceiptReturnItem,
  ReceiptReturnStatus,
  ReceiptReturnType,
} from "@/types/receipt-return.type";
import { PaymentMethod } from "@/common/enums/payment";
import { getDate } from "@/helpers/date";
import ModalSelectReturnProduct from "../components/ModalSelectReturnProduct";
import ModalSelectExchangeProduct, { ExchangeProductSelection } from "../components/ModalSelectExchangeProduct";
import { calculateReturnTotals } from "@/helpers/receipt-return-totals";
import { getNumberFromStringOrThrow } from "@/helpers/common";

interface LocationState {
  refId: string;
  refType: "order" | "debt";
  customerId?: string;
  customerName?: string;
  orderTotal?: number;
  orderDiscount?: number;
  debtTotal?: number;
  debtPaidAmount?: number;
  debtStatus?: string;
  orderProducts?: Array<{
    id: string;
    productId: string;
    code: string;
    productName: string;
    quantity: number;
    price: number;
    vatRate?: number;
    returnedQuantity?: number;
    periodId?: string;
    periodDate?: string;
  }>;
}

export default function useReceiptReturnForm() {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const [presentToast] = useIonToast();

  const requestId = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const isDebt = location.state?.refType === "debt";
  const canExchange = !isDebt || location.state?.debtStatus === "completed";
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
    location.state?.customerName || "Khách lẻ",
  );
  const [selectedProducts, setSelectedProducts] = useState<IReceiptReturnItem[]>(
    [],
  );
  const [preserveVat, setPreserveVat] = useState(true);
  const isExchange = formData.reason === "doi-san-pham";
  const keepVat = isExchange && !isDebt && preserveVat;
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
    },
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
              (p: IReceiptReturnItem) => !existingIds.has(p.id),
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
    setSelectedProducts((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const updateExchangeProduct = (
    id: string,
    field: "quantity" | "unitPrice" | "vatRate",
    value: number,
  ) => {
    setExchangeProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const numericValue = Number.isFinite(value) ? value : 0;
        if (field === "quantity") {
          const maxQuantity = Math.max(1, Number(item.inventory || 0));
          return {
            ...item,
            quantity: Math.min(maxQuantity, Math.max(1, numericValue)),
          };
        }
        if (field === "vatRate") {
          return { ...item, vatRate: Math.min(100, Math.max(0, numericValue)) };
        }
        return { ...item, unitPrice: Math.max(0, numericValue) };
      })
    );
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

  const { totalProduct, totalQuantity, totalAmount, exchangeAmount } = useMemo(
    () => calculateReturnTotals(
      selectedProducts, exchangeProducts, location.state?.orderProducts || [],
      isDebt, keepVat, location.state?.orderTotal, location.state?.orderDiscount, isExchange,
    ),
    [selectedProducts, exchangeProducts, location.state, isDebt, keepVat, isExchange],
  );
  const exchangeDifference = exchangeAmount - totalAmount;
  const projectedTotal = Math.max(
    0,
    (location.state?.debtTotal || 0) - totalAmount + (isExchange ? exchangeAmount : 0),
  );
  const projectedRemaining = projectedTotal - (location.state?.debtPaidAmount || 0);

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
      exchangeProducts.some((item) =>
        item.quantity >
          Number(item.inventory || 0) +
            (isDebt
              ? selectedProducts.filter((source) => source.productId === item.id).reduce(
                (sum, source) => sum + source.quantity,
                0,
              )
              : 0)
      )
    ) {
      newErrors.exchangeProducts = "Số lượng sản phẩm đổi vượt quá tồn kho";
    }

    if (
      formData.reason === "doi-san-pham" &&
      exchangeProducts.some((item) => !Number.isFinite(item.vatRate) || item.vatRate < 0 || item.vatRate > 100)
    ) {
      newErrors.exchangeProducts = "VAT sản phẩm đổi phải từ 0% đến 100%";
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
    if (submitting.current) return;
    if (isExchange && !canExchange) {
      await presentToast({
        message: "Chỉ được đổi sản phẩm khi phiếu thu đã hoàn thành",
        duration: 3000,
        color: "danger",
      });
      return;
    }
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

    submitting.current = true;
    try {
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
            receiptItemId: isDebt ? item.id : undefined,
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
          vatHandling: keepVat ? "preserve" : undefined,
          exchangeItems: exchangeProducts.map((item) => ({
            productId: item.id,
            productCode: item.productCode,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            vatRate: item.vatRate,
          })),
          requestId: requestId.current,
        };

        await createReceiptReturn(submissionData);

        await presentToast({
          message: status === ReceiptReturnStatus.DRAFT
            ? "Lưu nháp phiếu trả hàng thành công"
            : "Tạo phiếu trả hàng thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });

        history.goBack();
      });
    } finally {
      submitting.current = false;
    }
  };

  // Validate that we have necessary data from navigation
  useIonViewWillEnter(() => {
    if (!location.state?.refId) {
      presentToast({
        message: "Thiếu thông tin đơn hàng. Vui lòng thử lại.",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      history.goBack();
      return;
    }
    requestId.current = crypto.randomUUID();
    submitting.current = false;
    setSelectedProducts([]);
    setExchangeProducts([]);
    setPreserveVat(true);
    setErrors({});
    setCustomerName(location.state.customerName || "Khách lẻ");
    setFormData({
      note: "",
      reason: "khac",
      type: ReceiptReturnType.CUSTOMER,
      returnDate: getDate(new Date()).format(),
      refId: location.state.refId,
      refType: location.state.refType,
      customer: location.state.customerId,
      items: [],
      paymentMethod: PaymentMethod.CASH,
    });
  }, [location.key, location.state]);

  return {
    isLoading,
    formData,
    customerName,
    selectedProducts,
    errors,
    exchangeProducts,
    isExchange,
    isDebt,
    canExchange,
    totalProduct,
    totalQuantity,
    totalAmount,
    exchangeAmount,
    exchangeDifference,
    preserveVat,
    setPreserveVat,
    projectedTotal,
    projectedRemaining,
    openModalSelectProduct,
    handleProductQuantityChange,
    handleRemoveProduct,
    openModalSelectExchangeProduct,
    updateExchangeProduct,
    removeExchangeProduct,
    handleFormChange,
    handleSubmit,
  };
}
