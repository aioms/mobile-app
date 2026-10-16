import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
} from "@ionic/react";
import { checkmarkCircle, ellipseOutline } from "ionicons/icons";
import ModalCustom from "@/components/Modal/ModalCustom";
import useOrder from "@/hooks/apis/useOrder";
import { parseArrayData } from "@/helpers/common";
import { dayjsFormat, formatCurrency } from "@/helpers/formatters";
import { OrderStatus } from "@/common/enums/order";
import type { IOrder } from "@/types/order.type";

interface Props {
  dismiss: (data?: any, role?: string) => void;
  initialSelectedId?: string;
  customerId?: string;
}

const LIMIT = 15;

const ModalSelectOrder: React.FC<Props> = ({
  dismiss,
  initialSelectedId,
  customerId,
}) => {
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const { getList: getOrders } = useOrder();
  const [presentToast] = useIonToast();

  const fetchOrders = useCallback(
    async (targetPage: number = 1, append: boolean = false) => {
      const currentRequestId = ++requestIdRef.current;
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      try {
        const filters: Record<string, any> = {
          keyword: keyword.trim() || undefined,
          status: OrderStatus.COMPLETED,
        };
        if (customerId) {
          filters.customerId = customerId;
        }

        const response = await getOrders(filters, targetPage, LIMIT);

        if (currentRequestId !== requestIdRef.current) return;

        const newOrders = parseArrayData<IOrder>(response);

        if (append) {
          setOrders((prev) => {
            const existingIds = new Set(prev.map((o) => o.id));
            const filteredNew = newOrders.filter((o) => !existingIds.has(o.id));
            return [...prev, ...filteredNew];
          });
        } else {
          setOrders(newOrders);
          if (initialSelectedId && !selectedOrder) {
            const matched = newOrders.find((o) => o.id === initialSelectedId);
            if (matched) setSelectedOrder(matched);
          }
        }

        const total = response?.metadata?.total || 0;
        const currentCount = append ? orders.length + newOrders.length : newOrders.length;
        setHasNextPage(currentCount < total && newOrders.length === LIMIT);
      } catch (err: unknown) {
        if (currentRequestId !== requestIdRef.current) return;
        const message = err instanceof Error ? err.message : "Không thể tải danh sách đơn hàng";
        presentToast({
          message,
          duration: 2000,
          position: "top",
          color: "danger",
        });
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [keyword, customerId, getOrders, initialSelectedId, orders.length, presentToast, selectedOrder],
  );

  useEffect(() => {
    setPage(1);
    fetchOrders(1, false);
  }, [keyword, customerId]);

  const handleSearch = (e: CustomEvent) => {
    const value = e.detail.value || "";
    setKeyword(value);
  };

  const handleSelectOrder = (order: IOrder) => {
    if (selectedOrder?.id === order.id) {
      setSelectedOrder(null);
    } else {
      setSelectedOrder(order);
    }
  };

  const handleConfirm = () => {
    if (!selectedOrder) {
      presentToast({
        message: "Vui lòng chọn một đơn hàng",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }
    dismiss(selectedOrder, "confirm");
  };

  const handleInfiniteScroll = async (event: CustomEvent) => {
    if (!hasNextPage || isLoadingMore) {
      (event.target as HTMLIonInfiniteScrollElement).complete();
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchOrders(nextPage, true);
    (event.target as HTMLIonInfiniteScrollElement).complete();
  };

  return (
    <ModalCustom
      title="Chọn đơn hàng tham chiếu"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={handleConfirm}
      searchPlaceholder="Tìm mã đơn, tên khách..."
    >
      {selectedOrder && (
        <div className="mx-4 mt-2 mb-1 p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500">Đã chọn đơn: </span>
            <span className="font-bold text-blue-700">
              #{selectedOrder.code || selectedOrder.id.slice(0, 8)}
            </span>
            <span className="text-gray-600 ml-2">
              ({formatCurrency(selectedOrder.totalAmount)})
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedOrder(null)}
            className="text-xs text-rose-500 font-semibold"
          >
            Bỏ chọn
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <IonSpinner name="crescent" color="primary" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 px-4 text-gray-500 text-xs">
          {keyword ? `Không tìm thấy đơn hàng khớp với "${keyword}"` : "Không có đơn hàng đã hoàn thành nào"}
        </div>
      ) : (
        <IonList className="py-0">
          {orders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;
            const itemCount = order.items?.length || 0;
            return (
              <IonItem
                key={order.id}
                button
                detail={false}
                onClick={() => handleSelectOrder(order)}
                className="--min-height-60 cursor-pointer border-b border-gray-100"
              >
                <IonLabel className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-900">
                      #{order.code || order.id.slice(0, 8)}
                    </span>
                    <span className="font-bold text-xs text-blue-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>{order.customer?.name || "Khách lẻ"}</span>
                    <span>{dayjsFormat(order.createdAt, "DD/MM/YYYY HH:mm")}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    {itemCount} sản phẩm
                  </div>
                </IonLabel>
                <IonIcon
                  slot="end"
                  icon={isSelected ? checkmarkCircle : ellipseOutline}
                  color={isSelected ? "primary" : "medium"}
                  className="text-xl ml-2"
                />
              </IonItem>
            );
          })}
        </IonList>
      )}

      <IonInfiniteScroll
        threshold="100px"
        disabled={!hasNextPage || isLoadingMore}
        onIonInfinite={handleInfiniteScroll}
      >
        <IonInfiniteScrollContent loadingSpinner="crescent" />
      </IonInfiniteScroll>
    </ModalCustom>
  );
};

export default ModalSelectOrder;
