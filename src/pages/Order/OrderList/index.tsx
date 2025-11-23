import React, { useEffect, useState } from "react";
import {
  IonSpinner,
  IonButton,
  useIonToast,
  RefresherEventDetail,
  IonIcon,
  IonRippleEffect,
  useIonViewWillEnter,
} from "@ionic/react";
import { scanOutline } from "ionicons/icons";
import { useHistory } from "react-router";

import useOrder from "@/hooks/apis/useOrder";
import useProduct from "@/hooks/apis/useProduct";
import { useBarcodeScanner, useLoading, useStorage } from "@/hooks";
import { dayjsFormat } from "@/helpers/formatters";
import type { IOrder } from "@/types/order.type";

import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import FilterSection from "./components/FilterSection";
import OrderItem from "./components/OrderItem";

import "./OrderList.css";
import { capitalizeFirstLetter } from "@/helpers/common";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";

const LIMIT = 10;

const OrderList: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();

  const [orders, setOrders] = useState<IOrder[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { addItem, getItem } = useStorage();
  const { isLoading, withLoading } = useLoading();
  const { getList } = useOrder();
  const { getDetail: getProductDetail } = useProduct();

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      presentToast({
        message: error.message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    },
  });

  /**
   * Handles the result of a scanned barcode by adding the corresponding product to a draft order or creating a new draft.
   *
   * If the scanned product is not found or is out of stock, displays a toast notification. If a draft order exists, increments the quantity of the product if already present, or adds it as a new item. If no draft exists, creates a new draft order with the scanned product. Navigates to the order creation page upon success.
   *
   * @param value - The scanned barcode value
   */
  async function handleBarcodeScanned(value: string) {
    try {
      stopScan();
      const result = await getProductDetail(value);

      if (!result) {
        await presentToast({
          message: `Không tìm thấy sản phẩm với mã vạch ${value}`,
          duration: 2000,
          position: "top",
        });
        return
      }

      if (result.inventory === 0) {
        await presentToast({
          message: "Sản phẩm này đã hết hàng",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return
      }

      const draftOrder = await getItem("order_draft");

      if (draftOrder) {
        const existingItem = draftOrder.items.find(
          (item: { id: string }) => item.id === result.id
        );

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          draftOrder.items.push({
            id: result.id,
            productId: result.id,
            productName: result.productName,
            code: result.code,
            sellingPrice: result.sellingPrice,
            quantity: 1,
          });
        }

        await addItem("order_draft", draftOrder);
      } else {
        await addItem("order_draft", {
          items: [
            {
              id: result.id,
              productId: result.id,
              productName: result.productName,
              code: result.code,
              sellingPrice: result.sellingPrice,
              quantity: 1,
            },
          ],
        });
      }

      history.push(`/tabs/orders/create`);
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'OrderList',
        'BarcodeScanner',
        'handleBarcodeScanned'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  }

  const fetchOrders = async (
    pageNumber: number = 1,
    isLoadMore: boolean = false
  ) => {
    return await withLoading(async () => {
      try {
        const { data, metadata } = await getList(filters, pageNumber, LIMIT);

        if (!data.length) {
          if (!isLoadMore) {
            setOrders([]);
          }
          setHasMore(false);
        } else {
          setOrders((prev) => (isLoadMore ? [...prev, ...data] : data));
          setHasMore(data.length === LIMIT);

          // Set total orders count if available in data metadata
          if (metadata?.totalItems) {
            setTotalOrders(metadata.totalItems);
          }
        }
      } catch (error) {
        captureException(error as Error, createExceptionContext(
          'Order',
          'OrderList',
          'fetchOrders'
        ));

        presentToast({
          message: (error as Error).message || "Có lỗi xảy ra",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  // Always call fetchOrders when redirect to this view
  // useIonViewWillEnter(() => {
  //   setPage(1);
  //   fetchOrders(1, false);
  // }, [filters]);

  // Only call once when first enter this view
  useEffect(() => {
    setPage(1);
    fetchOrders(1, false);
  }, [filters]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchOrders(nextPage, true);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchOrders().finally(() => {
      event.detail.complete();
    });
  };

  const handleCancelOrder = () => fetchOrders();

  return (
    <div className="">
      {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
      <Refresher onRefresh={handleRefresh} />

      {/* Order Count */}
      <div className="flex justify-between items-center bg-card rounded-lg shadow-sm mb-2 p-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-medium">
            Tổng số đơn hàng: {totalOrders}
          </h2>
          <div className="date-display">
            {capitalizeFirstLetter(dayjsFormat(new Date(), "dddd, DD MMMM YYYY", "vi"))}
          </div>
        </div>
        <div
          className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center ion-activatable ripple-parent"
          onClick={() => startScan()}
        >
          <IonIcon icon={scanOutline} className="text-3xl text-teal-400" />
          <IonRippleEffect></IonRippleEffect>
        </div>
      </div>

      {/* Filter Section */}
      <FilterSection onFilterChange={handleFilterChange} />

      {/* Order List */}
      <div>
        {orders.length > 0 ? (
          orders.map((order) => (
            <OrderItem
              key={order.id}
              order={order}
              onCancelOrder={handleCancelOrder}
            />
          ))
        ) : !isLoading ? (
          <div className="text-center text-gray-500 py-4">
            <p>Không tìm thấy đơn hàng nào</p>
          </div>
        ) : null}

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <IonButton
              fill="clear"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? <IonSpinner name="crescent" /> : "Xem thêm"}
            </IonButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
