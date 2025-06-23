import React, { useEffect, useRef, useState } from "react";
import {
  IonIcon,
  IonRippleEffect,
  useIonModal,
  useIonToast,
} from "@ionic/react";
import { chevronDownOutline, scanOutline, search } from "ionicons/icons";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";

import { useBarcodeScanner } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";

import ModalSelectProduct from "@/components/ModalSelectProduct";
import ProductItem from "./ProductItem";
import ErrorMessage from "@/components/ErrorMessage";

interface IProductItem {
  id: string;
  productName: string;
  productCode: number;
  code: string;
  quantity: number;
  sellingPrice: number;
}

type Props = {
  error: string;
  productItems: IProductItem[];
  onAddItem: (product: IProductItem) => void;
  onRemoveItem: (id: string) => void;
};

const ProductList: React.FC<Props> = ({
  error,
  productItems,
  onAddItem,
  onRemoveItem,
}) => {
  const [showDownArrow, setShowDownArrow] = useState(false);

  const { getDetail: getProductDetail } = useProduct();

  const [presentToast] = useIonToast();
  const productItemsListRef = useRef<HTMLDivElement>(null);

  const addProductToCartItem = async (productCode: string) => {
    try {
      const product = await getProductDetail(productCode);

      const productData = {
        id: product.id,
        productName: product.productName,
        productCode: product.productCode,
        code: product.code,
        sellingPrice: product.sellingPrice,
        quantity: 1,
      };
      onAddItem(productData);
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
          onAddItem({
            ...data,
            quantity: 1,
          });
        }
      },
    });
  };

  // Show/hide down arrow based on scroll position
  useEffect(() => {
    const container = productItemsListRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled to bottom, hide arrow
      const atBottom =
        Math.ceil(container.scrollTop + container.clientHeight) >=
        container.scrollHeight;
      setShowDownArrow(!atBottom && productItems.length > 1);
    };

    handleScroll(); // Initial check

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [productItems.length]);

  // Show arrow if overflow and not at bottom
  useEffect(() => {
    const container = productItemsListRef.current;
    if (!container) return;
    const isOverflow = container.scrollHeight > container.clientHeight;
    const atBottom =
      Math.ceil(container.scrollTop + container.clientHeight) >=
      container.scrollHeight;
    setShowDownArrow(isOverflow && !atBottom && productItems.length > 1);
  }, [productItems.length]);

  // Scroll to next item when down arrow is clicked
  const handleScrollToNextOrderItem = () => {
    const container = productItemsListRef.current;
    if (!container) return;

    const itemEls = Array.from(
      container.querySelectorAll('[data-product-item="true"]')
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

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm p-4 mt-3">
        <ErrorMessage message={error} />
        <h2 className="text-md font-medium text-foreground mt-2 mb-2">
          Sản phẩm
        </h2>
        <div className="flex items-center space-x-2 mb-3">
          <div
            className="ion-activatable receipt-debt-ripple-parent p-2"
            onClick={() => openModalSelectProduct()}
          >
            <IonIcon icon={search} className="text-2xl mr-1" />
            Tìm kiếm hàng hóa
            <IonRippleEffect className="custom-ripple"></IonRippleEffect>
          </div>
          <div
            className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center ion-activatable ripple-parent"
            onClick={() => startScan()}
          >
            <IonIcon icon={scanOutline} className="text-2xl text-teal-400" />
            <IonRippleEffect></IonRippleEffect>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="relative">
          <div
            className="max-h-96 overflow-y-auto no-scrollbar"
            ref={productItemsListRef}
          >
            {productItems.length > 0 ? (
              productItems.map((item) => (
                <ProductItem
                  key={item.id}
                  {...item}
                  attrs={{ "data-product-item": "true" }}
                  onRowChange={(data) => onAddItem({ ...item, ...data })}
                  onRemoveItem={() => onRemoveItem(item.id)}
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
    </>
  );
};

export default ProductList;
