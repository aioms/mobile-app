import React, { useState, useRef, useEffect, useMemo } from "react";
import { useHistory, useParams } from "react-router";
import { IonTextareaCustomEvent, TextareaChangeEventDetail } from "@ionic/core";
import { Dialog } from "@capacitor/dialog";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonRadioGroup,
  IonRadio,
  IonIcon,
  useIonModal,
  useIonToast,
  IonFooter,
  IonRippleEffect,
  InputCustomEvent,
  useIonViewWillEnter,
} from "@ionic/react";
import {
  checkmarkCircle,
  checkmarkCircleOutline,
  chevronBack,
  chevronDownOutline,
  removeCircleOutline,
  scanOutline,
  search,
  createOutline,
} from "ionicons/icons";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import { useLoading, useBarcodeScanner } from "@/hooks";
import useOrder from "@/hooks/apis/useOrder";
import useProduct from "@/hooks/apis/useProduct";

import {
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from "@/common/constants/order";
import { OrderStatus, PaymentMethod } from "@/common/enums/order";
import { cn } from "@/lib/utils";

import OrderItem from "./components/OrderItem";
import ModalSelectProduct from "../components/ModalSelectProduct";
import ModalSelectCustomer from "../components/ModalSelectCustomer";
import ErrorMessage from "@/components/ErrorMessage";
import PaymentModal, {
  PaymentMethod as PaymentModalMethod,
} from "@/components/PaymentModal";
import { PaymentTransactionDto } from "@/types/payment.type";
import { PaymentMethod as PaymentMethodEnum } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";
import OrderSummarySection from "./components/OrderSummarySection";
import VATSection from "./components/VATSection";
import OrderNotesSection from "./components/OrderNotesSection";
import { IOrderItem, IOrderItemSubmission } from "./components/orderUpdate.d";

import "./OrderUpdate.css";

// Replaced with IOrderItem from orderUpdate.d.ts

interface IFormData {
  code: string;
  status: string;
  note: string;
  customer: string;
  paymentMethod: PaymentMethod;
  vatEnabled: boolean;
  companyName?: string;
  taxCode?: string;
  email?: string;
  remark?: string;
  discountType?: "percentage" | "fixed";
  discountPercentage?: number;
  discountAmount?: number;
  discountAmountFormatted?: string;
}

const initialFormData: IFormData = {
  code: "",
  status: "",
  note: "",
  customer: "",
  paymentMethod: PaymentMethod.CASH,
  vatEnabled: false,
  discountType: "percentage",
  discountPercentage: 0,
  discountAmount: 0,
  discountAmountFormatted: "",
};

const OrderUpdate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();

  const [formData, setFormData] = useState<IFormData>(initialFormData);
  const [orderItems, setOrderItems] = useState<IOrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDownArrow, setShowDownArrow] = useState(false);

  // Add payment modal state management
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  // Add customer name state
  const [selectedCustomerName, setSelectedCustomerName] =
    useState<string>("Khách lẻ");

  const [presentToast] = useIonToast();
  const orderItemsListRef = useRef<HTMLDivElement>(null);

  const { isLoading, withLoading } = useLoading();
  const { getDetail: getOrderDetail, update: updateOrder } = useOrder();
  const { getDetail: getProductDetail } = useProduct();

  // Individual status checks
  const isOrderDraft = useMemo(() => {
    return formData.status === OrderStatus.DRAFT;
  }, [formData.status]);

  const isOrderPending = useMemo(() => {
    return formData.status === OrderStatus.PENDING;
  }, [formData.status]);

  const canUpdateOrder = useMemo(() => {
    return isOrderDraft || isOrderPending;
  }, [isOrderDraft, isOrderPending]);

  // Determine if we're in edit mode (DRAFT orders are editable)
  const isEditMode = canUpdateOrder;
  const isOrderPaid = formData.status === OrderStatus.COMPLETED

  const addItemToOrderItems = (productId: string, product: Record<string, any>) => {
    // if (product.inventory <= 0) {
    //   presentToast({
    //     message: "Sản phẩm đã hết hàng",
    //     duration: 2000,
    //     position: "top",
    //     color: "warning",
    //   });
    //   return
    // }

    const productData = {
      id: product.id,
      productId: product.id,
      productName: product.productName,
      code: product.code,
      sellingPrice: product.sellingPrice,
      quantity: 1,
      inventory: product.inventory, // Add inventory data
      shipNow: false, // Default to false for new items
    };

    // Write function check if item is exists in orderItems, then increase quantity of item
    const existingItem = orderItems.find((item) => item.productId === productId);
    if (existingItem) {
      handleItemChange(existingItem.id, {
        quantity: existingItem.quantity + 1,
      });
      return;
    } else {
      setOrderItems((prev) => [
        {
          ...productData,
        },
        ...prev,
      ]);
    }
  };

  const addProductToCartItem = async (productCode: string) => {
    if (!isEditMode) {
      await presentToast({
        message: "Chỉ có thể chỉnh sửa đơn hàng ở trạng thái nháp",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    try {
      const product = await getProductDetail(productCode);

      addItemToOrderItems(product.id, product);
    } catch (error) {
      await presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  // Barcode scanner hook - only enabled for DRAFT orders
  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: (value: string) => {
      stopScan();
      addProductToCartItem(value);
    },
    onError: async (error: Error) => {
      presentToast({
        message: error.message || "Có lỗi xảy ra khi quét mã vạch",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    },
  });

  // Modal for product selection
  const [presentModalProduct, dismissModalProduct] = useIonModal(
    ModalSelectProduct,
    {
      dismiss: (data: any, role: string) => dismissModalProduct(data, role),
    }
  );

  // Modal for customer selection
  const [presentModalCustomer, dismissModalCustomer] = useIonModal(
    ModalSelectCustomer,
    {
      dismiss: (data: any, role: string) => dismissModalCustomer(data, role),
    }
  );

  const openModalSelectProduct = () => {
    if (!isEditMode) {
      presentToast({
        message: "Chỉ có thể chỉnh sửa đơn hàng ở trạng thái nháp",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    presentModalProduct({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role === "confirm" && data) {
          // Handle both array (multi-select) and single object (legacy support)
          const products = Array.isArray(data) ? data : [data];

          // Process each selected product
          products.forEach(product => {
            addItemToOrderItems(product.id, product);
          });
        }
      },
    });
  };

  const openModalSelectCustomer = () => {
    if (!isEditMode) {
      presentToast({
        message: "Chỉ có thể chỉnh sửa đơn hàng ở trạng thái nháp",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    presentModalCustomer({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role !== "confirm") return;

        if (!data) {
          setSelectedCustomerName("Khách lẻ");
          setFormData((prev) => ({
            ...prev,
            customer: "",
          }));
          return;
        }

        const [customerId, customerName] = data.split("__");
        setSelectedCustomerName(customerName);

        // Update form data with the selected customer ID
        setFormData((prev) => ({
          ...prev,
          customer: customerId,
        }));
      },
    });
  };

  const handleInputChange = (e: InputCustomEvent) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is updated
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDiscountChange = (e: InputCustomEvent) => {
    const { name, value } = e.target;

    switch (name) {
      case "discountPercentage": {
        const numericValue = Number(value || 0);
        if (numericValue >= 0) {
          // Cap percentage at 100
          const cappedValue = Math.min(numericValue, 100);
          setFormData((prev) => ({
            ...prev,
            discountPercentage: cappedValue,
          }));
        }
        break;
      }
      case "discountAmount": {
        const numericValue = parseCurrencyInput(`${value || 0}`);
        if (numericValue >= 0) {
          const formattedValue = formatCurrencyWithoutSymbol(numericValue);
          setFormData((prev) => ({
            ...prev,
            discountAmount: numericValue,
            discountAmountFormatted: formattedValue,
          }));
        }
        break;
      }
      default:
        break;
    }
  };

  const handleDiscountTypeChange = (e: CustomEvent) => {
    const { value } = e.detail;
    setFormData((prev) => ({
      ...prev,
      discountType: value,
    }));
  };

  const handlePaymentMethodChange = (e: CustomEvent) => {
    const { value } = e.detail;
    setFormData((prev) => ({
      ...prev,
      paymentMethod: value,
    }));
  };

  const handleVatToggle = (e: CustomEvent) => {
    const { checked } = e.detail;
    setFormData((prev) => ({
      ...prev,
      vatEnabled: checked,
    }));
  };

  const handleTextAreaChange = (
    e: IonTextareaCustomEvent<TextareaChangeEventDetail>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleItemChange = (id: string, data: Partial<IOrderItem>) => {
    if (!isEditMode) return;

    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    if (!isEditMode) return;

    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!orderItems.length) {
      newErrors.items = "Vui lòng thêm ít nhất một sản phẩm";
    }

    // Validate order items for shipNow and quantity constraints
    const invalidItems = orderItems.filter(item => {
      // Check if shipNow is checked but quantity is 0
      if (item.shipNow && item.quantity === 0) {
        return true;
      }
      // Check if regular item (not shipNow) exceeds available stock
      if (!item.shipNow && item.inventory !== undefined && item.quantity > item.inventory) {
        return true;
      }
      return false;
    });

    if (invalidItems.length > 0) {
      newErrors.items = "Có sản phẩm không hợp lệ: Không thể đặt hàng với số lượng 0 khi chọn 'Giao ngay', hoặc vượt quá tồn kho";
    }

    if (formData.vatEnabled) {
      if (!formData.companyName) {
        newErrors.companyName = "Vui lòng nhập tên công ty";
      }
      if (!formData.taxCode) {
        newErrors.taxCode = "Vui lòng nhập mã số thuế";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      const itemPrice = item.sellingPrice * item.quantity;
      return total + itemPrice;
    }, 0);
  }, [orderItems]);

  const calculateTotalVat = useMemo(() => {
    return orderItems.reduce((totalVat, item) => {
      const itemPrice = item.sellingPrice * item.quantity;
      const vatAmount = (itemPrice * (item.vatRate || 0)) / 100;
      return totalVat + vatAmount;
    }, 0);
  }, [orderItems]);

  const calculateDiscount = useMemo(() => {
    const subtotal = calculateTotal;
    if (formData.discountType === "percentage" && formData.discountPercentage) {
      return (subtotal * Number(formData.discountPercentage)) / 100;
    } else if (formData.discountType === "fixed" && formData.discountAmount) {
      return formData.discountAmount;
    }
    return 0;
  }, [formData.discountType, formData.discountPercentage, formData.discountAmount, calculateTotal]);

  const calculateFinalTotal = useMemo(() => {
    const subtotal = calculateTotal;
    const discount = calculateDiscount;
    const vat = calculateTotalVat;
    const finalTotal = subtotal - discount + vat;
    return finalTotal > 0 ? finalTotal : 0;
  }, [calculateTotal, calculateDiscount, calculateTotalVat]);

  // Show/hide down arrow based on scroll position
  useEffect(() => {
    const container = orderItemsListRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled to bottom, hide arrow
      const atBottom =
        Math.ceil(container.scrollTop + container.clientHeight) >=
        container.scrollHeight;
      setShowDownArrow(!atBottom && orderItems.length > 1);
    };

    handleScroll(); // Initial check

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [orderItems.length]);

  // Show arrow if overflow and not at bottom
  useEffect(() => {
    const container = orderItemsListRef.current;
    if (!container) return;
    const isOverflow = container.scrollHeight > container.clientHeight;
    const atBottom =
      Math.ceil(container.scrollTop + container.clientHeight) >=
      container.scrollHeight;
    setShowDownArrow(isOverflow && !atBottom && orderItems.length > 1);
  }, [orderItems.length]);

  // Scroll to next item when down arrow is clicked
  const handleScrollToNextOrderItem = () => {
    const container = orderItemsListRef.current;
    if (!container) return;

    const itemEls = Array.from(
      container.querySelectorAll('[data-order-item="true"]')
    );
    if (itemEls.length < 2) return;

    // Find the first item that is not fully visible
    const containerRect = container.getBoundingClientRect();
    let scrollToEl: HTMLElement | null = null;
    for (let i = 1; i < itemEls.length; i++) {
      const el = itemEls[i] as HTMLElement;
      const elRect = el.getBoundingClientRect();
      if (elRect.bottom > containerRect.bottom) {
        scrollToEl = el;
        break;
      }
    }
    // If all items are visible, scroll to last
    if (!scrollToEl) scrollToEl = itemEls[itemEls.length - 1] as HTMLElement;
    scrollToEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancel = async () => {
    try {
      const { value } = await Dialog.confirm({
        title: "Xác nhận hủy đơn hàng",
        message: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      });

      if (!value) return;

      const orderUpdated = await updateOrder(id, {
        status: OrderStatus.CANCELLED,
      });

      if (!orderUpdated?.id) {
        throw new Error("Hủy đơn hàng thất bại");
      }

      presentToast({
        message: "Hủy đơn hàng thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });
      history.goBack();
    } catch (error) {
      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  // Handle order update for DRAFT and PENDING orders (without changing status)
  const handleOrderUpdate = async () => {
    const isValid = validateForm();
    if (!isValid) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin đơn hàng",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    try {
      // Show confirmation prompt
      const { value } = await Dialog.confirm({
        title: "Cập nhật đơn hàng",
        message: "Bạn có chắc chắn muốn cập nhật thông tin đơn hàng này không?",
      });
      if (!value) return;

      await withLoading(async () => {
        const orderData = {
          ...buildOrderData(),
        };

        const orderUpdated = await updateOrder(id, orderData);

        if (!orderUpdated?.id) {
          throw new Error("Cập nhật đơn hàng thất bại");
        }

        presentToast({
          message: "Cập nhật đơn hàng thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });

        // Refresh order data
        await fetchOrderDetail();
      });
    } catch (error) {
      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra khi cập nhật đơn hàng",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handlePaymentComplete = async (
    amount: number,
    method: PaymentModalMethod
  ) => {
    if (!pendingOrderData) {
      presentToast({
        message: "Không tìm thấy thông tin đơn hàng",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    try {
      // Map PaymentModalMethod to PaymentMethodEnum
      const paymentMethodEnum = method === "cash"
        ? PaymentMethodEnum.CASH
        : PaymentMethodEnum.BANK_TRANSFER;

      // Create transaction data
      const transactionData: PaymentTransactionDto = {
        amount,
        paymentMethod: paymentMethodEnum,
        type: TransactionType.PAYMENT,
        note: `Thanh toán đơn hàng ${formData.code}`,
      };

      // Prepare order data with transaction and status
      const orderData = {
        ...pendingOrderData,
        transaction: transactionData,
      };
      console.log({ orderData });

      // Update order with payment information
      const orderUpdated = await updateOrder(id, orderData);
      console.log({ orderUpdated });

      if (!orderUpdated?.id) {
        throw new Error("Cập nhật đơn hàng thất bại");
      }

      // Close payment modal
      setIsPaymentModalOpen(false);
      setPendingOrderData(null);

      presentToast({
        message: "Thanh toán đơn hàng thành công",
        duration: 2000,
        position: "top",
        color: "success",
      });

      // Navigate back
      history.goBack();
    } catch (error) {
      console.error({ error });

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra khi thanh toán",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const handleConfirmOrder = async () => {
    const isValid = validateForm();

    if (!isValid) {
      presentToast({
        message: "Vui lòng kiểm tra lại thông tin đơn hàng",
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    // For DRAFT orders, open payment modal for confirmation
    const { value } = await Dialog.confirm({
      title: "Xác nhận đơn hàng",
      message: "Bạn có chắc chắn muốn xác nhận và thanh toán đơn hàng này không?",
    });

    if (!value) return;

    // Prepare order data for payment
    const orderData = {
      ...buildOrderData(),
      status: OrderStatus.COMPLETED
    };

    // Store pending order data and open payment modal
    setPendingOrderData(orderData);
    setIsPaymentModalOpen(true);
  };

  const fetchOrderDetail = async () => {
    await withLoading(async () => {
      try {
        const orderDetail = await getOrderDetail(id);

        if (!orderDetail) {
          presentToast({
            message: "Không tìm thấy thông tin đơn hàng",
            duration: 2000,
            position: "top",
            color: "danger",
          });
          history.goBack();
          return;
        }

        // Map order items to component format and fetch inventory data
        const items = await Promise.all(
          orderDetail.items?.map(async (item: any) => {
            let inventory = undefined;
            try {
              // Fetch product detail to get inventory data
              const productDetail = await getProductDetail(item.code);
              inventory = productDetail.inventory;
            } catch (error) {
              // If product detail fetch fails, continue without inventory data
              console.warn(`Failed to fetch inventory for product ${item.code}:`, error);
            }

            return {
              id: item.productId,
              productId: item.productId,
              productName: item.productName,
              code: item.code,
              quantity: item.quantity,
              sellingPrice: item.price,
              vatRate: item.vatRate || 0,
              inventory: inventory,
              shipNow: item.shipNow || false, // Add shipNow from API response
            };
          }) || []
        );

        setOrderItems(items);

        // Calculate discount type and value
        let discountType = "fixed";
        let discountPercentage = 0;
        let discountAmount = orderDetail.discountAmount || 0;

        const subtotal = items.reduce((total: number, item: any) => {
          return total + item.sellingPrice * item.quantity;
        }, 0);

        if (subtotal > 0) {
          const percentage = (discountAmount / subtotal) * 100;
          // If percentage is a clean number (like 5%, 10%, etc.), use percentage type
          if (percentage === Math.round(percentage)) {
            discountType = "percentage";
            discountPercentage = percentage;
            discountAmount = 0;
          }
        }

        // Set form data
        setFormData({
          code: orderDetail.code,
          status: orderDetail.status,
          note: orderDetail.note || "",
          customer: orderDetail.customer?.id || "",
          paymentMethod: orderDetail.paymentMethod || PaymentMethod.CASH,
          vatEnabled: !!orderDetail.vatInfo,
          companyName: orderDetail.vatInfo?.companyName || "",
          taxCode: orderDetail.vatInfo?.taxCode || "",
          email: orderDetail.vatInfo?.email || "",
          remark: orderDetail.vatInfo?.remark || "",
          discountType: discountType as "percentage" | "fixed",
          discountPercentage,
          discountAmount,
          discountAmountFormatted: formatCurrencyWithoutSymbol(discountAmount),
        });

        // Set customer name
        if (orderDetail.customer?.name) {
          setSelectedCustomerName(orderDetail.customer.name);
        } else {
          setSelectedCustomerName("Khách lẻ");
        }
      } catch (error) {
        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra khi tải dữ liệu",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  const buildOrderData = () => ({
    customer: formData.customer,
    paymentMethod: formData.paymentMethod,
    discountAmount: calculateDiscount,
    note: formData.note,
    items: orderItems.map((item): IOrderItemSubmission => ({
      productId: item.id,
      productName: item.productName,
      code: item.code,
      quantity: item.quantity,
      price: item.sellingPrice,
      vatRate: item.vatRate || 0,
      shipNow: item.shipNow || false,
    })),
    vatEnabled: formData.vatEnabled,
    vatInfo: formData.vatEnabled
      ? {
        companyName: formData.companyName,
        taxCode: formData.taxCode,
        email: formData.email,
        remark: formData.remark,
      }
      : null,
  });

  useIonViewWillEnter(() => {
    id && fetchOrderDetail();
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              className="text-gray-600"
              onClick={() => {
                history.goBack();
              }}
            >
              <IonIcon slot="icon-only" icon={chevronBack} />
              Trở lại
            </IonButton>
          </IonButtons>
          <IonTitle>Cập nhật đơn hàng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-background">
        {/* Order Status Header */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div
            className={`p-4 bg-${getOrderStatusColor(
              formData.status
            )} rounded-lg`}
          >
            <div className="flex items-center">
              <IonIcon
                icon={checkmarkCircle}
                className="text-white text-xl mr-2"
              />
              <span className="text-white font-medium">
                {getOrderStatusLabel(formData.status)}
              </span>
            </div>
            <div className="text-white mt-1">Mã đơn hàng: #{formData.code}</div>
          </div>
        </div>

        {/* 1. Product Selection Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-foreground">Sản phẩm</h2>
            </div>

            {errors.items && (
              <div className="text-destructive text-xs mb-2">
                {errors.items}
              </div>
            )}

            {/* Barcode Scanner Section - Enabled for DRAFT */}
            {isEditMode && (
              <>
                {/* Barcode Scanner Section */}
                <div
                  className="ion-activatable bg-teal-50 border-2 border-dashed border-teal-200 rounded-lg p-6 mb-4 text-center cursor-pointer hover:bg-teal-100 transition-colors"
                  onClick={() => startScan()}
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
                      <IonIcon
                        icon={scanOutline}
                        className="text-3xl text-teal-600"
                      />
                    </div>
                    <p className="text-teal-700 font-medium text-base">
                      Quét mã vạch để thêm sản phẩm
                    </p>
                  </div>
                </div>

                <div
                  className="ion-activatable common-ripple-parent mb-3 cursor-pointer hover:bg-gray-50 transition-colors p-2 rounded-lg"
                  onClick={openModalSelectProduct}
                >
                  <IonIcon icon={search} className="text-2xl text-blue-600 mr-2" />
                  <span className="text-blue-700 font-medium">Tìm kiếm hàng hóa</span>
                  <IonRippleEffect></IonRippleEffect>
                </div>
              </>
            )}

            {/* Disabled state for non-DRAFT orders */}
            {!isEditMode && (
              <>
                <div className="ion-activatable bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 mb-4 text-center opacity-65 cursor-not-allowed">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <IonIcon
                        icon={scanOutline}
                        className="text-3xl text-gray-400"
                      />
                    </div>
                    <p className="text-gray-500 font-medium text-base">
                      Quét mã vạch để thêm sản phẩm
                    </p>
                  </div>
                </div>

                <div className="ion-activatable receipt-import-ripple-parent mb-3 opacity-65 cursor-not-allowed">
                  <IonIcon icon={search} className="text-2xl text-gray-400" />
                  Tìm kiếm hàng hóa
                </div>
              </>
            )}

            <div className="relative">
              <div
                className="max-h-96 overflow-y-auto no-scrollbar"
                ref={orderItemsListRef}
              >
                {orderItems.length > 0 ? (
                  orderItems.map((item) => (
                    <OrderItem
                      key={item.id}
                      {...item}
                      orderStatus={formData.status}
                      attrs={{ "data-order-item": "true" }}
                      onRowChange={(data) => handleItemChange(item.id, data)}
                      onRemoveItem={() => handleRemoveItem(item.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Chưa có sản phẩm nào
                  </div>
                )}
              </div>
              {showDownArrow && (
                <button
                  type="button"
                  aria-label="Xem thêm"
                  onClick={handleScrollToNextOrderItem}
                  className="absolute bottom-0 left-0 w-full flex justify-center pointer-events-auto bg-gradient-to-t from-white/90 to-transparent"
                  style={{ border: "none", outline: "none" }}
                >
                  <IonIcon
                    icon={chevronDownOutline}
                    className="text-3xl text-gray-400 animate-bounce"
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Discount Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <h2 className="text-lg font-medium text-foreground mb-3">
              Giảm giá
            </h2>
            <div className="mb-4">
              <IonRadioGroup
                value={formData.discountType || "percentage"}
                onIonChange={isEditMode ? handleDiscountTypeChange : () => { }}
              >
                <div className={cn("flex gap-4 mb-3", { "opacity-65": !isEditMode })}>
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.discountType === "percentage" ||
                        !formData.discountType,
                      border: formData.discountType === "fixed",
                    })}
                  >
                    <IonRadio value="percentage" disabled={!isEditMode}>
                      Theo %
                    </IonRadio>
                  </IonItem>
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.discountType === "fixed",
                      border:
                        formData.discountType === "percentage" ||
                        !formData.discountType,
                    })}
                  >
                    <IonRadio value="fixed" disabled={!isEditMode}>
                      Theo VND
                    </IonRadio>
                  </IonItem>
                </div>
              </IonRadioGroup>

              {formData.discountType === "percentage" ? (
                <IonInput
                  label="Giảm giá (%)"
                  labelPlacement="floating"
                  fill="solid"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="Nhập % giảm giá"
                  name="discountPercentage"
                  className={cn("custom-padding border rounded-lg", { "opacity-65": !isEditMode })}
                  value={formData.discountPercentage}
                  onIonChange={handleDiscountChange}
                  disabled={!isEditMode}
                ></IonInput>
              ) : (
                <IonInput
                  label="Giảm giá (VND)"
                  labelPlacement="floating"
                  fill="solid"
                  placeholder="Nhập số tiền giảm giá"
                  name="discountAmount"
                  className={cn("custom-padding border rounded-lg", { "opacity-65": !isEditMode })}
                  value={formData.discountAmountFormatted || 0}
                  onIonInput={handleDiscountChange}
                  disabled={!isEditMode}
                ></IonInput>
              )}
            </div>
          </div>
        </div>

        {/* 3. Payment Method Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div>
              <h2 className="text-lg font-medium text-foreground mb-2">
                Khách hàng
              </h2>
              <div className="mb-4">
                <div
                  className={cn("ion-activatable common-ripple-parent break-normal p-2", {
                    "opacity-65 cursor-not-allowed": !isEditMode,
                    "cursor-pointer hover:bg-gray-50 transition-colors": isEditMode
                  })}
                  onClick={isEditMode ? openModalSelectCustomer : undefined}
                >
                  <IonIcon
                    icon={search}
                    className={cn("text-2xl mr-2", {
                      "text-gray-400": !isEditMode,
                      "text-blue-600": isEditMode
                    })}
                  />
                  <span className={cn({
                    "text-gray-500": !isEditMode,
                    "text-blue-700": isEditMode
                  })}>
                    {selectedCustomerName}
                  </span>
                  {isEditMode && <IonRippleEffect></IonRippleEffect>}
                </div>
                <ErrorMessage message={errors.customer} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-3">
                Phương thức thanh toán
              </h2>
              <IonRadioGroup
                value={formData.paymentMethod}
                onIonChange={isEditMode ? handlePaymentMethodChange : () => { }}
                className="mt-2"
              >
                <div className="flex gap-4">
                  <IonItem
                    lines="none"
                    className={cn(
                      `rounded-lg transition-colors`,
                      {
                        "bg-custom-primary border border-custom-primary":
                          formData.paymentMethod === PaymentMethod.CASH ||
                          !formData.paymentMethod,
                        border:
                          formData.paymentMethod ===
                          PaymentMethod.BANK_TRANSFER,
                        "opacity-50 cursor-not-allowed": !isEditMode,
                      }
                    )}
                  >
                    <IonRadio value={PaymentMethod.CASH} disabled={!isEditMode}>
                      Tiền mặt
                    </IonRadio>
                  </IonItem>
                  <IonItem
                    lines="none"
                    className={cn(
                      `rounded-lg transition-colors`,
                      {
                        "bg-custom-primary border border-custom-primary":
                          formData.paymentMethod ===
                          PaymentMethod.BANK_TRANSFER ||
                          !formData.paymentMethod,
                        border: formData.paymentMethod === PaymentMethod.CASH,
                        "opacity-50 cursor-not-allowed": !isEditMode,
                      }
                    )}
                  >
                    <IonRadio
                      value={PaymentMethod.BANK_TRANSFER}
                      disabled={!isEditMode}
                    >
                      Chuyển khoản
                    </IonRadio>
                  </IonItem>
                </div>
              </IonRadioGroup>
            </div>
          </div>
        </div>

        {/* 4. VAT Information Section */}
        <VATSection
          formData={formData}
          isEditMode={isEditMode}
          errors={errors}
          onVatToggle={handleVatToggle}
          onInputChange={handleInputChange}
          onTextAreaChange={handleTextAreaChange}
        />

        {/* 5. Order Notes Section */}
        <OrderNotesSection
          note={formData.note}
          isEditMode={isEditMode}
          onTextAreaChange={handleTextAreaChange}
        />

        {/* 6. Order Summary Section */}
        <OrderSummarySection
          subtotal={calculateTotal}
          discount={calculateDiscount}
          vatTotal={calculateTotalVat}
          finalTotal={calculateFinalTotal}
        />

        {/* 7. Cancel order Section */}
        {formData.status !== OrderStatus.CANCELLED && (
          <div>
            <IonButton
              expand="block"
              fill="outline"
              className="rounded-lg text-red-600"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {isLoading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <IonIcon icon={removeCircleOutline} slot="start" />
                  Hủy đơn
                </>
              )}
            </IonButton>
          </div>
        )}
      </IonContent>

      <IonFooter className="ion-no-border">
        <div className="flex justify-between p-3 bg-card">

          {/* Confirm Order Button - only for non-paid orders */}
          {!isOrderPaid && (
            <IonButton
              expand="block"
              className={cn("rounded-lg grow", {
                "grow": !isEditMode,
              })}
              onClick={handleConfirmOrder}
              disabled={isLoading}
              color="primary"
            >
              {isLoading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    slot="start"
                  />
                  Xác nhận đơn hàng
                </>
              )}
            </IonButton>
          )}

          {/* Update Button - for DRAFT and PENDING orders */}
          {isEditMode && (
            <IonButton
              expand="block"
              className={cn("rounded-lg grow", {
                "grow": isOrderPaid,
              })}
              onClick={handleOrderUpdate}
              disabled={isLoading}
              color="primary"
              fill="outline"
            >
              {isLoading ? (
                "Đang xử lý..."
              ) : (
                <>
                  <IonIcon
                    icon={createOutline}
                    slot="start"
                  />
                  Cập nhật
                </>
              )}
            </IonButton>
          )}
        </div>
      </IonFooter>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPendingOrderData(null);
        }}
        orderData={{
          totalAmount: calculateFinalTotal,
        }}
        onPaymentComplete={handlePaymentComplete}
      />

    </IonPage>
  );
};

export default OrderUpdate;
