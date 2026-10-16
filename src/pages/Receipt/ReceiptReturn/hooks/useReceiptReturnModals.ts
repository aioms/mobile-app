import { useIonModal } from "@ionic/react";
import { OverlayEventDetail } from "@ionic/core";
import ModalSelectReturnProduct from "../components/ModalSelectReturnProduct";
import ModalSelectExchangeProduct, {
  ExchangeProductSelection,
} from "../components/ModalSelectExchangeProduct";
import ModalSelectProduct from "@/components/ModalSelectProduct";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import ModalSelectOrder from "../components/ModalSelectOrder";
import { getNumberFromStringOrThrow } from "@/helpers/common";
import type { IOrder } from "@/types/order.type";
import type {
  IReceiptReturnFormData,
  IReceiptReturnItem,
} from "@/types/receipt-return.type";

export interface OrderItem {
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
}

interface UseReceiptReturnModalsParams {
  formData: IReceiptReturnFormData;
  setFormData: React.Dispatch<React.SetStateAction<IReceiptReturnFormData>>;
  customerName: string;
  setCustomerName: (name: string) => void;
  setSupplierName: (name: string) => void;
  setSelectedOrderCode: (code: string) => void;
  orderProductsRef: React.MutableRefObject<OrderItem[]>;
  setOrderProducts: (products: OrderItem[]) => void;
  setOrderTotal: (total: number | undefined) => void;
  setOrderDiscount: (discount: number | undefined) => void;
  setSelectedProducts: React.Dispatch<React.SetStateAction<IReceiptReturnItem[]>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  exchangeProductsRef: React.MutableRefObject<ExchangeProductSelection[]>;
  setExchangeProducts: React.Dispatch<React.SetStateAction<ExchangeProductSelection[]>>;
}

export function useReceiptReturnModals({
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
}: UseReceiptReturnModalsParams) {
  // Modal 1: Select products from Order/Debt
  const [presentModalOrderProduct, dismissModalOrderProduct] = useIonModal(
    ModalSelectReturnProduct,
    {
      dismiss: (data: unknown, role: string) => dismissModalOrderProduct(data, role),
      getOrderProducts: () => orderProductsRef.current,
      refType: formData.refType || "order",
    },
  );

  // Modal 2: Select products from catalog
  const [presentModalCatalogProduct, dismissModalCatalogProduct] = useIonModal(
    ModalSelectProduct,
    {
      dismiss: (data: unknown, role: string) => dismissModalCatalogProduct(data, role),
    },
  );

  // Modal 3: Select Order
  const [presentModalOrder, dismissModalOrder] = useIonModal(
    ModalSelectOrder,
    {
      dismiss: (data: unknown, role: string) => dismissModalOrder(data, role),
      initialSelectedId: formData.refId,
      customerId: formData.customer,
    },
  );

  // Modal 4: Select Customer
  const [presentModalCustomer, dismissModalCustomer] = useIonModal(
    ModalSelectCustomer,
    {
      dismiss: (data: unknown, role: string) => dismissModalCustomer(data, role),
      multiple: false,
      initialSelectedValue: formData.customer ? `${formData.customer}__${customerName}` : "",
    },
  );

  // Modal 5: Select Supplier
  const [presentModalSupplier, dismissModalSupplier] = useIonModal(
    ModalSelectSupplier,
    {
      dismiss: (data: unknown, role: string) => dismissModalSupplier(data, role),
      multi: false,
    },
  );

  // Modal 6: Select Exchange Product
  const [presentModalExchangeProduct, dismissModalExchangeProduct] = useIonModal(
    ModalSelectExchangeProduct,
    {
      dismiss: (data: unknown, role: string) => dismissModalExchangeProduct(data, role),
      getSelectedProducts: () => exchangeProductsRef.current,
    },
  );

  const openModalSelectOrder = () => {
    presentModalOrder({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail<IOrder>>) => {
        const { role, data: order } = event.detail;
        if (role === "confirm" && order) {
          setFormData((prev) => ({
            ...prev,
            refId: order.id,
            refType: "order",
            customer: order.customer?.id,
          }));
          setSelectedOrderCode(order.code || order.id.slice(0, 8));
          setCustomerName(order.customer?.name || "Khách lẻ");
          setOrderTotal(order.totalAmount);
          setOrderDiscount(order.discountAmount);

          const mapped: OrderItem[] = (order.items || []).map((item) => ({
            id: item.productId,
            productId: item.productId,
            code: item.code || String(item.productId || ""),
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            vatRate: item.vatRate,
            returnedQuantity: item.returnedQuantity,
          }));
          setOrderProducts(mapped);
          setSelectedProducts([]);

          if (errors.refId) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.refId;
              return next;
            });
          }
        }
      },
    });
  };

  const handleClearOrder = () => {
    setFormData((prev) => ({
      ...prev,
      refId: undefined,
      refType: undefined,
      reason:
        prev.reason === "Đổi sản phẩm" || prev.reason === "doi-san-pham"
          ? "Sản phẩm lỗi"
          : prev.reason,
    }));
    setSelectedOrderCode("");
    setOrderProducts([]);
    setOrderTotal(undefined);
    setOrderDiscount(undefined);
    setSelectedProducts([]);
  };

  const openModalSelectCustomer = () => {
    presentModalCustomer({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail<string>>) => {
        const { role, data } = event.detail;
        if (role === "confirm" && data) {
          if (data === "individual__Khách lẻ") {
            setFormData((prev) => ({ ...prev, customer: undefined }));
            setCustomerName("Khách lẻ");
          } else {
            const [id, name] = data.split("__");
            setFormData((prev) => ({ ...prev, customer: id }));
            setCustomerName(name || "Khách lẻ");
          }
        }
      },
    });
  };

  const openModalSelectSupplier = () => {
    presentModalSupplier({
      onWillDismiss: (event: CustomEvent<OverlayEventDetail<string>>) => {
        const { role, data } = event.detail;
        if (role === "confirm" && data) {
          const [id, name] = data.split("__");
          setFormData((prev) => ({ ...prev, supplier: id }));
          setSupplierName(name || "Nhà cung cấp");
          if (errors.supplier) {
            setErrors((prev) => {
              const next = { ...prev };
              delete next.supplier;
              return next;
            });
          }
        }
      },
    });
  };

  const openModalSelectProduct = () => {
    if (orderProductsRef.current.length > 0) {
      presentModalOrderProduct({
        onWillDismiss: (event: CustomEvent<OverlayEventDetail<IReceiptReturnItem[]>>) => {
          const { role, data } = event.detail;
          if (role === "confirm" && data) {
            setSelectedProducts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newProducts = data.filter((p) => !existingIds.has(p.id));
              return [...prev, ...newProducts];
            });
            if (errors.products) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.products;
                return next;
              });
            }
          }
        },
      });
    } else {
      presentModalCatalogProduct({
        onWillDismiss: (event: CustomEvent<OverlayEventDetail<any[]>>) => {
          const { role, data } = event.detail;
          if (role === "confirm" && Array.isArray(data)) {
            const mappedItems: IReceiptReturnItem[] = data.map((p: any) => {
              let pCode = 0;
              try {
                pCode = getNumberFromStringOrThrow(String(p.code || p.productCode || "0"));
              } catch {
                pCode = 0;
              }
              return {
                id: p.id,
                productId: p.id,
                code: p.code || String(p.productCode || ""),
                productCode: pCode,
                productName: p.name || p.productName || "Sản phẩm",
                quantity: 1,
                costPrice: p.sellingPrice || p.costPrice || 0,
                originalQuantity: p.inventory || 9999,
                inventory: p.inventory,
                metadata: {
                  returnedQuantity: 1,
                },
              };
            });

            setSelectedProducts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newProducts = mappedItems.filter((p) => !existingIds.has(p.id));
              return [...prev, ...newProducts];
            });

            if (errors.products) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.products;
                return next;
              });
            }
          }
        },
      });
    }
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

  return {
    openModalSelectOrder,
    handleClearOrder,
    openModalSelectCustomer,
    openModalSelectSupplier,
    openModalSelectProduct,
    openModalSelectExchangeProduct,
  };
}
