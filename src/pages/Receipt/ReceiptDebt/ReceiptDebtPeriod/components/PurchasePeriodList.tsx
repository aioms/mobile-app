import { useState, useEffect, useRef } from "react";
import { FC } from "react";
import { IonButton, IonIcon, IonRippleEffect } from "@ionic/react";
import { scanOutline, search } from "ionicons/icons";

import { IReceiptItemPeriod } from "@/types/receipt-debt.type";
import PurchasePeriod from "./PurchasePeriod";
import { getDate } from "@/helpers/date";

type Props = {
  items: Record<string, IReceiptItemPeriod[]>;
  onAddPeriod?: () => void;
  onScanBarcode?: () => void;
  onQuantityChange?: (
    dateKey: string,
    itemId: string,
    newQuantity: number
  ) => void;
  onPriceChange?: (
    dateKey: string,
    itemId: string,
    newPrice: number
  ) => void;
  onRemoveProduct?: (dateKey: string, itemId: string) => void;
};

const PurchasePeriodList: FC<Props> = ({
  items = {},
  onAddPeriod,
  onScanBarcode,
  onQuantityChange,
  onPriceChange,
  onRemoveProduct,
}) => {
  const [showDownArrow, setShowDownArrow] = useState(false);
  const productItemsListRef = useRef<HTMLDivElement>(null);

  // Get all items as a flat array for counting and scrolling logic
  const allItems = Object.values(items).flat();

  // Show/hide down arrow based on scroll position
  useEffect(() => {
    const container = productItemsListRef.current;
    if (!container) return;

    const handleScroll = () => {
      // If scrolled to bottom, hide arrow
      const atBottom =
        Math.ceil(container.scrollTop + container.clientHeight) >=
        container.scrollHeight;
      setShowDownArrow(!atBottom && allItems.length > 1);
    };

    handleScroll(); // Initial check

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [allItems.length]);

  // Show arrow if overflow and not at bottom
  useEffect(() => {
    const container = productItemsListRef.current;
    if (!container) return;
    const isOverflow = container.scrollHeight > container.clientHeight;
    const atBottom =
      Math.ceil(container.scrollTop + container.clientHeight) >=
      container.scrollHeight;
    setShowDownArrow(isOverflow && !atBottom && allItems.length > 1);
  }, [allItems.length]);

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

  // Helper function to check if a period is editable (current date)
  const isCurrentDatePeriod = (dateKey: string) => {
    const currentDateKey = getDate(new Date()).format("YYYY-MM-DD");
    return dateKey === currentDateKey;
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 mt-3 overflow-hidden">
      {/* Header with action buttons */}
      <h2 className="text-md font-medium text-foreground mt-2 mb-2">
        Đợt Thu Sản Phẩm
      </h2>
      <div className="flex items-center space-x-2 mb-3">
        <div
          className="ion-activatable receipt-debt-ripple-parent p-2"
          onClick={onAddPeriod}
        >
          <IonIcon icon={search} className="text-2xl mr-1" />
          Tìm kiếm hàng hóa
          <IonRippleEffect className="custom-ripple"></IonRippleEffect>
        </div>
        <div
          className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center ion-activatable ripple-parent"
          onClick={onScanBarcode}
        >
          <IonIcon icon={scanOutline} className="text-2xl text-teal-400" />
          <IonRippleEffect></IonRippleEffect>
        </div>
      </div>

      {/* Product items container */}
      <div
        ref={productItemsListRef}
        className="max-h-96 overflow-y-auto"
        data-product-items-container="true"
      >
        {Object.keys(items).length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Chưa có đợt thu nào</p>
            <p className="text-xs mt-1">
              Nhấn "Quét mã" hoặc "Thêm" để bắt đầu
            </p>
          </div>
        ) : (
          /* Render items grouped by date, sorted with newest dates first */
          Object.entries(items)
            .sort(([dateA], [dateB]) => {
              // Sort dates in descending order (newest first)
              return new Date(dateB).getTime() - new Date(dateA).getTime();
            })
            .map(([date, dateItems]) => (
              <div
                key={date}
                className="border-b border-gray-100 last:border-b-0 mb-1"
              >
                {/* Render only one PurchasePeriod component per date group */}
                <div data-product-item="true">
                  <PurchasePeriod
                    items={dateItems} // Pass all items for this date
                    periodDate={date}
                    editable={isCurrentDatePeriod(date)}
                    onQuantityChange={(itemId, newQuantity) =>
                      onQuantityChange?.(date, itemId, newQuantity)
                    }
                    onPriceChange={(itemId, newPrice) =>
                      onPriceChange?.(date, itemId, newPrice)
                    }
                    onRemove={(itemId) => onRemoveProduct?.(date, itemId)}
                  />
                </div>
              </div>
            ))
        )}
      </div>

      {/* Scroll indicator */}
      {showDownArrow && (
        <div className="flex justify-center py-2">
          <IonButton
            fill="clear"
            size="small"
            onClick={handleScrollToNextOrderItem}
            className="text-gray-400"
          >
            ↓ Xem thêm
          </IonButton>
        </div>
      )}
    </div>
  );
};

export default PurchasePeriodList;
