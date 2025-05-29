import React, { useState, useRef, useEffect } from "react";
import { useHistory } from "react-router";
import { IonTextareaCustomEvent, TextareaChangeEventDetail } from "@ionic/core";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonTextarea,
  IonRadioGroup,
  IonRadio,
  IonToggle,
  IonIcon,
  useIonModal,
  useIonToast,
  IonFooter,
  IonSelect,
  IonSelectOption,
  IonRippleEffect,
  InputCustomEvent,
  useIonViewWillLeave,
  useIonViewWillEnter,
  useIonViewDidEnter,
} from "@ionic/react";
import {
  checkmarkCircleOutline,
  chevronDownOutline,
  removeCircleOutline,
  saveOutline,
  scanOutline,
  search,
} from "ionicons/icons";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import { useLoading, useBarcodeScanner, useStorage } from "@/hooks";
import useOrder from "@/hooks/apis/useOrder";
import useProduct from "@/hooks/apis/useProduct";

import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import { OrderStatus, PaymentMethod } from "@/common/enums/order";
import { cn } from "@/lib/utils";

import OrderItem from "./components/OrderItem";
import ModalSelectProduct from "../components/ModalSelectProduct";

import "./order-create.css";
import { Dialog } from "@capacitor/dialog";
import ErrorMessage from "@/components/ErrorMessage";
import { isHasProperty } from "@/helpers/common";

interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  sellingPrice: number;
}

interface IFormData {
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
  note: "",
  customer: "",
  paymentMethod: PaymentMethod.CASH,
  vatEnabled: false,
  discountType: "percentage",
  discountPercentage: 0,
  discountAmount: 0,
  discountAmountFormatted: "",
};

const OrderCreate: React.FC = () => {
  const history = useHistory();

  const [formData, setFormData] = useState<IFormData>(initialFormData);
  const [orderItems, setOrderItems] = useState<IOrderItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDownArrow, setShowDownArrow] = useState(false);

  const [presentToast] = useIonToast();
  const orderItemsListRef = useRef<HTMLDivElement>(null);

  const { addItem, getItem, removeItem } = useStorage();
  const { isLoading, withLoading } = useLoading();
  const { create: createOrder } = useOrder();
  const { getDetail: getProductDetail } = useProduct();

  const addProductToCartItem = async (productCode: string) => {
    try {
      const product = await getProductDetail(productCode);

      const productData = {
        id: product.id,
        productId: product.id,
        productName: product.productName,
        code: product.code,
        sellingPrice: product.sellingPrice,
        quantity: 1,
      };

      // Write function check if item is exists in orderItems, then increase quantity of item
      const existingItem = orderItems.find((item) => item.id === product.id);
      if (existingItem) {
        handleItemChange(existingItem.id, {
          quantity: existingItem.quantity + 1,
        });
        return;
      } else {
        setOrderItems((prev) => [
          ...prev,
          {
            ...productData,
          },
        ]);
      }
    } catch (error) {
      await presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  // Barcode scanner hook
  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: (value: string) => {
      stopScan();
      addProductToCartItem(value);
    },
    onError: async (error: Error) => {
      await presentToast({
        message: error.message || "Có lỗi xảy ra khi quét mã vạch",
        duration: 1500,
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

  const openModalSelectProduct = () => {
    presentModalProduct({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;

        if (role === "confirm" && data) {
          setOrderItems((prev) => [
            ...prev,
            {
              ...data,
              quantity: 1,
            },
          ]);
        }
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

  const handleCustomerChange = (e: CustomEvent) => {
    const { value } = e.detail;
    setFormData((prev) => ({
      ...prev,
      customer: value,
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
    setOrderItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer) {
      newErrors.customer = "Vui lòng chọn khách hàng";
    }

    if (!orderItems.length) {
      newErrors.items = "Vui lòng thêm ít nhất một sản phẩm";
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

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const itemPrice = item.sellingPrice * item.quantity;
      return total + itemPrice;
    }, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateTotal();
    if (formData.discountType === "percentage" && formData.discountPercentage) {
      return (subtotal * Number(formData.discountPercentage)) / 100;
    } else if (formData.discountType === "fixed" && formData.discountAmount) {
      return formData.discountAmount;
    }
    return 0;
  };

  const calculateFinalTotal = () => {
    const finalTotal = calculateTotal() - calculateDiscount();
    return finalTotal > 0 ? finalTotal : 0;
  };

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
    const { value } = await Dialog.confirm({
      title: "Xác nhận hủy đơn hàng",
      message: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
    });

    if (!value) return;

    await removeItem("order_draft");
    history.replace("/tabs/home");
  };

  const handleSaveDraft = async () => {
    await addItem("order_draft", {
      ...formData,
      items: orderItems,
    });

    presentToast({
      message: "Lưu tạm thành công",
      duration: 500,
      position: "top",
      color: "success",
    });
  };

  const handleSubmit = async () => {
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

    const { value } = await Dialog.confirm({
      title: "Xác nhận tạo đơn hàng",
      message: "Bạn có chắc chắn muốn tạo đơn hàng này không?",
    });

    if (!value) return;

    await withLoading(async () => {
      try {
        const status =
          formData.paymentMethod === PaymentMethod.CASH
            ? OrderStatus.PAID
            : OrderStatus.PENDING;

        const orderData = {
          status,
          customerType: formData.customer,
          paymentMethod: formData.paymentMethod,
          note: formData.note,
          discountAmount: calculateDiscount(),
          items: orderItems.map((item) => ({
            productId: item.id,
            productName: item.productName,
            code: item.code,
            quantity: item.quantity,
            price: item.sellingPrice,
          })),
          vatInfo: formData.vatEnabled
            ? {
                companyName: formData.companyName,
                taxCode: formData.taxCode,
                email: formData.email,
                remark: formData.remark,
              }
            : null,
        };

        const orderCreated = await createOrder(orderData);

        if (!orderCreated.id) {
          throw new Error("Tạo đơn hàng thất bại");
        }

        presentToast({
          message: "Tạo đơn hàng thành công",
          duration: 2000,
          position: "top",
          color: "success",
        });

        await removeItem("order_draft");
        history.goBack();
      } catch (error) {
        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  useIonViewWillEnter(() => {
    const loadDataFromStorage = async () => {
      const order = await getItem("order_draft");

      if (order) {
        const { items, ...rest } = order;

        items && setOrderItems(items);
        isHasProperty(rest) && setFormData(rest);
      }
    };

    loadDataFromStorage();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home"></IonBackButton>
          </IonButtons>
          <IonTitle>Tạo đơn hàng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding bg-background">
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
              className="ion-activatable receipt-import-ripple-parent mb-3"
              onClick={() => openModalSelectProduct()}
            >
              <IonIcon icon={search} className="text-2xl" />
              Tìm kiếm hàng hóa
              <IonRippleEffect className="custom-ripple"></IonRippleEffect>
            </div>

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
                onIonChange={handleDiscountTypeChange}
              >
                <div className="flex gap-4 mb-3">
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.discountType === "percentage" ||
                        !formData.discountType,
                      border: formData.discountType === "fixed",
                    })}
                  >
                    <IonRadio value="percentage">Theo %</IonRadio>
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
                    <IonRadio value="fixed">Theo VND</IonRadio>
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
                  className="custom-padding border rounded-lg"
                  value={formData.discountPercentage}
                  onIonChange={handleDiscountChange}
                ></IonInput>
              ) : (
                <IonInput
                  label="Giảm giá (VND)"
                  labelPlacement="floating"
                  fill="solid"
                  placeholder="Nhập số tiền giảm giá"
                  name="discountAmount"
                  className="custom-padding border rounded-lg"
                  value={formData.discountAmountFormatted || 0}
                  onIonInput={handleDiscountChange}
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
                <IonItem className="rounded-lg border border-input">
                  <IonSelect
                    interface="popover"
                    placeholder="Chọn loại khách hàng"
                    value={formData.customer}
                    onIonChange={handleCustomerChange}
                  >
                    <IonSelectOption value="regular">Khách lẻ</IonSelectOption>
                    <IonSelectOption value="loyal">Khách quen</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <ErrorMessage message={errors.customer} />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground mb-3">
                Phương thức thanh toán
              </h2>
              <IonRadioGroup
                value={formData.paymentMethod}
                onIonChange={handlePaymentMethodChange}
                className="mt-2"
              >
                <div className="flex gap-4">
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.paymentMethod === PaymentMethod.CASH ||
                        !formData.paymentMethod,
                      border:
                        formData.paymentMethod === PaymentMethod.BANK_TRANSFER,
                    })}
                  >
                    <IonRadio value={PaymentMethod.CASH}>Tiền mặt</IonRadio>
                  </IonItem>
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.paymentMethod ===
                          PaymentMethod.BANK_TRANSFER ||
                        !formData.paymentMethod,
                      border: formData.paymentMethod === PaymentMethod.CASH,
                    })}
                  >
                    <IonRadio value={PaymentMethod.BANK_TRANSFER}>
                      Chuyển khoản
                    </IonRadio>
                  </IonItem>
                </div>
              </IonRadioGroup>
            </div>
          </div>
        </div>

        {/* 4. VAT Information Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-foreground">
                Xuất hóa đơn VAT
              </h2>
              <IonToggle
                checked={formData.vatEnabled}
                onIonChange={handleVatToggle}
                className="text-primary"
              ></IonToggle>
            </div>

            {formData.vatEnabled && (
              <div className="mt-3 space-y-3">
                <IonInput
                  className={cn("custom-padding border rounded-lg", {
                    "ion-valid": !errors.companyName,
                    "ion-invalid ion-touched": errors.companyName,
                  })}
                  label="Tên công ty"
                  labelPlacement="floating"
                  fill="solid"
                  placeholder="Nhập tên công ty"
                  name="companyName"
                  value={formData.companyName}
                  onIonChange={handleInputChange}
                  errorText={errors.companyName}
                ></IonInput>

                <IonInput
                  className={cn("custom-padding border rounded-lg", {
                    "ion-valid": !errors.taxCode,
                    "ion-invalid ion-touched": errors.taxCode,
                  })}
                  label="Mã số thuế"
                  labelPlacement="floating"
                  fill="solid"
                  placeholder="Nhập mã số thuế"
                  name="taxCode"
                  value={formData.taxCode}
                  onIonChange={handleInputChange}
                  errorText={errors.taxCode}
                ></IonInput>

                <IonInput
                  label="Email"
                  labelPlacement="floating"
                  fill="solid"
                  name="email"
                  type="email"
                  placeholder="Nhập email"
                  className="custom-padding border rounded-lg"
                  value={formData.email}
                  onIonChange={handleInputChange}
                  errorText={errors.email}
                ></IonInput>

                <IonTextarea
                  label="Ghi chú"
                  labelPlacement="floating"
                  name="remark"
                  value={formData.remark}
                  onIonChange={handleTextAreaChange}
                  placeholder="Nhập ghi chú"
                  rows={2}
                  fill="outline"
                  className="border border-input rounded-lg px-2"
                ></IonTextarea>
              </div>
            )}
          </div>
        </div>

        {/* 5. Order Notes Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <h2 className="text-lg font-medium text-foreground mb-3">
              Ghi chú
            </h2>
            <IonTextarea
              name="note"
              value={formData.note}
              onIonChange={handleTextAreaChange}
              placeholder="Nhập ghi chú đơn hàng"
              rows={3}
              className="border border-input rounded-lg px-2"
            ></IonTextarea>
          </div>
        </div>

        {/* 6. Order Summary Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Tổng tiền hàng</span>
              <span className="text-foreground">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Giảm giá</span>
              <span className="text-foreground">
                {formatCurrency(calculateDiscount())}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold pt-2 border-t border-border">
              <span className="text-foreground"> Thành tiền </span>
              <span className="text-green-600">
                {formatCurrency(calculateFinalTotal())}
              </span>
            </div>
          </div>
        </div>

        {/* 7. Cancel order Section */}
        <div className="">
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
      </IonContent>

      <IonFooter className="ion-no-border">
        <div className="flex justify-between p-2 bg-card">
          {/* Create a button save draft */}
          <IonButton
            expand="block"
            fill="outline"
            className="rounded-lg mr-2"
            onClick={handleSaveDraft}
            disabled={isLoading}
          >
            {isLoading ? (
              "Đang xử lý..."
            ) : (
              <>
                <IonIcon icon={saveOutline} slot="start" />
                Lưu tạm
              </>
            )}
          </IonButton>
          <IonButton
            expand="block"
            className="rounded-lg grow"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              "Đang xử lý..."
            ) : (
              <>
                <IonIcon icon={checkmarkCircleOutline} slot="start" />
                Xác nhận đơn hàng
              </>
            )}
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
};

export default OrderCreate;
