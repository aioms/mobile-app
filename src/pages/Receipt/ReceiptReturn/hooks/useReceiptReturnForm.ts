import { useMemo, useRef, useState } from "react";
import { useIonToast, useIonViewWillEnter } from "@ionic/react";
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
import { calculateReturnTotals } from "@/helpers/receipt-return-totals";
import { getNumberFromStringOrThrow } from "@/helpers/common";
import {
  useReceiptReturnModals,
  OrderItem,
} from "./useReceiptReturnModals";
import type { ExchangeProductSelection } from "../components/ModalSelectExchangeProduct";

interface LocationState {
  refId?: string;
  refType?: "order" | "debt";
  type?: ReceiptReturnType;
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  orderTotal?: number;
  orderDiscount?: number;
  debtTotal?: number;
  debtPaidAmount?: number;
  debtStatus?: string;
  orderProducts?: OrderItem[];
}

export default function useReceiptReturnForm() {
  const location = useLocation<LocationState>();
  const history = useHistory();
  const [presentToast] = useIonToast();

  const requestId = useRef(crypto.randomUUID());
  const submitting = useRef(false);
  const isDebt = location.state?.refType === "debt";
  const isFixedRoute = Boolean(location.state?.refId && (isDebt || location.state?.orderProducts?.length));

  const { isLoading, withLoading } = useLoading();
  const { create: createReceiptReturn } = useReceiptReturn();

  const initialType =
    location.state?.type ||
    (location.state?.supplierId
      ? ReceiptReturnType.SUPPLIER
      : ReceiptReturnType.CUSTOMER);

  const [formData, setFormData] = useState<IReceiptReturnFormData>({
    note: "",
    reason: initialType === ReceiptReturnType.SUPPLIER ? "Ngừng bán" : "Sản phẩm lỗi",
    customReason: "",
    type: initialType,
    returnDate: getDate(new Date()).format(),
    refId: location.state?.refId,
    refType: location.state?.refType,
    customer: location.state?.customerId,
    supplier: location.state?.supplierId,
    items: [],
    paymentMethod: PaymentMethod.CASH,
  });

  const [customerName, setCustomerName] = useState<string>(
    location.state?.customerName || "Khách lẻ",
  );
  const [supplierName, setSupplierName] = useState<string>(
    location.state?.supplierName || "Chọn nhà cung cấp",
  );
  const [selectedOrderCode, setSelectedOrderCode] = useState<string>(
    location.state?.refType === "order" && location.state?.refId ? String(location.state.refId).slice(0, 8) : "",
  );

  const [orderProducts, setOrderProducts] = useState<OrderItem[]>(
    location.state?.orderProducts || [],
  );
  const orderProductsRef = useRef<OrderItem[]>(orderProducts);
  orderProductsRef.current = orderProducts;

  const [orderTotal, setOrderTotal] = useState<number | undefined>(location.state?.orderTotal);
  const [orderDiscount, setOrderDiscount] = useState<number | undefined>(location.state?.orderDiscount);

  const [selectedProducts, setSelectedProducts] = useState<IReceiptReturnItem[]>([]);
  const [preserveVat, setPreserveVat] = useState(true);
  const isExchange =
    formData.reason === "doi-san-pham" || formData.reason === "Đổi sản phẩm";
  const keepVat = isExchange && !isDebt && preserveVat;
  const canExchange = Boolean((!isDebt || location.state?.debtStatus === "completed") && (formData.refType === "order" || formData.refId));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [exchangeProducts, setExchangeProducts] = useState<ExchangeProductSelection[]>([]);
  const exchangeProductsRef = useRef<ExchangeProductSelection[]>([]);
  exchangeProductsRef.current = exchangeProducts;

  const {
    openModalSelectOrder,
    handleClearOrder,
    openModalSelectCustomer,
    openModalSelectSupplier,
    openModalSelectProduct,
    openModalSelectExchangeProduct,
  } = useReceiptReturnModals({
    formData,
    setFormData,
    customerName,
    setCustomerName,
    setSupplierName,
    setSelectedOrderCode,
    orderProductsRef,
    setOrderProducts,
    setOrderTotal,
    setOrderDiscount,
    setSelectedProducts,
    errors,
    setErrors,
    exchangeProductsRef,
    setExchangeProducts,
  });

  const handleTypeChange = (type: ReceiptReturnType) => {
    if (isFixedRoute) return;
    setFormData((prev) => ({
      ...prev,
      type,
      refId: undefined,
      refType: undefined,
      customer: undefined,
      supplier: undefined,
      reason:
        type === ReceiptReturnType.SUPPLIER ? "Ngừng bán" : "Sản phẩm lỗi",
      customReason: "",
    }));
    setSelectedOrderCode("");
    setOrderProducts([]);
    setSelectedProducts([]);
    setExchangeProducts([]);
    setErrors({});
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
      }),
    );
  };

  const removeExchangeProduct = (id: string) => {
    setExchangeProducts((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "reason" && value !== "Lý do khác" && value !== "khac"
        ? { customReason: "" }
        : {}),
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const { totalProduct, totalQuantity, totalAmount, exchangeAmount } = useMemo(
    () => calculateReturnTotals(
      selectedProducts, exchangeProducts, orderProducts,
      isDebt, keepVat, orderTotal, orderDiscount, isExchange,
    ),
    [selectedProducts, exchangeProducts, orderProducts, isDebt, keepVat, orderTotal, orderDiscount, isExchange],
  );

  const exchangeDifference = exchangeAmount - totalAmount;
  const projectedTotal = Math.max(
    0,
    (location.state?.debtTotal || 0) - totalAmount + (isExchange ? exchangeAmount : 0),
  );
  const projectedRemaining = projectedTotal - (location.state?.debtPaidAmount || 0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (isExchange && !formData.refId) {
      newErrors.refId = "Đổi sản phẩm yêu cầu chọn đơn hàng tham chiếu";
    }

    if (selectedProducts.length === 0) {
      newErrors.products = "Vui lòng chọn ít nhất 1 sản phẩm trả";
    }

    if (formData.type === ReceiptReturnType.SUPPLIER && !formData.supplier) {
      newErrors.supplier = "Vui lòng chọn nhà cung cấp";
    }

    if (isExchange && exchangeProducts.length === 0) {
      newErrors.exchangeProducts = "Vui lòng chọn sản phẩm đổi";
    }

    if (
      isExchange &&
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
      isExchange &&
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
        message: "Chỉ được đổi sản phẩm khi đơn hàng hoặc phiếu thu đã hoàn thành",
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
        const effectiveReason =
          (formData.reason === "Lý do khác" || formData.reason === "khac") &&
          formData.customReason?.trim()
            ? formData.customReason.trim()
            : formData.reason;

        const submissionData: CreateReceiptReturnRequestDto = {
          note: formData.note,
          totalQuantity,
          totalProduct,
          totalAmount,
          reason: effectiveReason,
          type: formData.type,
          status,
          returnDate: formData.returnDate,
          refId: formData.refId || undefined,
          refType: formData.refType || undefined,
          customer: formData.type === ReceiptReturnType.CUSTOMER ? formData.customer : undefined,
          supplier: formData.type === ReceiptReturnType.SUPPLIER ? formData.supplier : undefined,
          items: selectedProducts.map((item) => {
            let pCode = 0;
            try {
              pCode = getNumberFromStringOrThrow(item.code || String(item.productCode || "0"));
            } catch {
              pCode = 0;
            }
            return {
              id: item.id,
              receiptItemId: isDebt ? item.id : undefined,
              productId: item.productId,
              productCode: pCode,
              productName: item.productName,
              quantity: item.quantity,
              costPrice: item.costPrice,
              metadata: {
                returnedQuantity: item.quantity,
                ...item.metadata,
              },
            };
          }),
          paymentMethod: formData.paymentMethod,
          operationType: isExchange ? "exchange" : "return",
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

  useIonViewWillEnter(() => {
    requestId.current = crypto.randomUUID();
    submitting.current = false;
    setSelectedProducts([]);
    setExchangeProducts([]);
    setPreserveVat(true);
    setErrors({});

    const initialType =
      location.state?.type ||
      (location.state?.supplierId
        ? ReceiptReturnType.SUPPLIER
        : ReceiptReturnType.CUSTOMER);

    setCustomerName(location.state?.customerName || "Khách lẻ");
    setSupplierName(location.state?.supplierName || "Chọn nhà cung cấp");
    setSelectedOrderCode(
      location.state?.refType === "order" && location.state?.refId
        ? String(location.state.refId).slice(0, 8)
        : "",
    );
    setOrderProducts(location.state?.orderProducts || []);
    setOrderTotal(location.state?.orderTotal);
    setOrderDiscount(location.state?.orderDiscount);

    setFormData({
      note: "",
      reason:
        initialType === ReceiptReturnType.SUPPLIER
          ? "Ngừng bán"
          : "Sản phẩm lỗi",
      customReason: "",
      type: initialType,
      returnDate: getDate(new Date()).format(),
      refId: location.state?.refId,
      refType: location.state?.refType,
      customer: location.state?.customerId,
      supplier: location.state?.supplierId,
      items: [],
      paymentMethod: PaymentMethod.CASH,
    });
  }, [location.key, location.state]);

  return {
    isLoading,
    formData,
    customerName,
    supplierName,
    selectedOrderCode,
    isFixedRoute,
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
    handleTypeChange,
    openModalSelectOrder,
    handleClearOrder,
    openModalSelectCustomer,
    openModalSelectSupplier,
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
