import { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import useNotification from "@/hooks/apis/useNotification";
import { useCustomToast } from "@/hooks/useCustomToast";
import {
  FilterTabOption,
  NotificationCategory,
  NotificationItemDto,
  NotificationStatus,
} from "../types";

const PAGE_SIZE = 15;

export const useNotificationList = () => {
  const history = useHistory();
  const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } =
    useNotification();
  const { showSuccess, showError } = useCustomToast();

  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [category, setCategory] = useState<NotificationCategory>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchUnread = useCallback(async () => {
    const count = await getUnreadCount();
    setUnreadCount(count);
  }, [getUnreadCount]);

  const loadData = useCallback(
    async (pageToLoad: number, isRefresh = false) => {
      try {
        if (pageToLoad === 1 && !isRefresh) {
          setLoading(true);
        } else if (pageToLoad > 1) {
          setLoadingMore(true);
        }

        setError(null);

        const response = await getNotifications({
          page: pageToLoad,
          limit: PAGE_SIZE,
          status:
            category === "unread" ? NotificationStatus.UNREAD : undefined,
        });

        const items = response.data || [];
        const metadata = response.metadata;

        if (pageToLoad === 1) {
          setNotifications(items);
        } else {
          setNotifications((prev) => [...prev, ...items]);
        }

        const totalPages = metadata?.totalPages ?? 1;
        setHasMore(pageToLoad < totalPages);
        setPage(pageToLoad);
      } catch (err) {
        const msg = (err as Error).message || "Không thể tải danh sách thông báo";
        setError(msg);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [category, getNotifications]
  );

  useEffect(() => {
    loadData(1);
    fetchUnread();
  }, [loadData, fetchUnread]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(1, true), fetchUnread()]);
  }, [loadData, fetchUnread]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    await loadData(page + 1);
  }, [hasMore, loadData, loadingMore, page]);

  const handleCategoryChange = useCallback((newCategory: NotificationCategory) => {
    setCategory(newCategory);
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount === 0) return;
    const ok = await markAllAsRead();
    if (ok) {
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, status: NotificationStatus.READ }))
      );
      setUnreadCount(0);
      await showSuccess("Đã đánh dấu tất cả là đã đọc");
    } else {
      await showError("Không thể đánh dấu đã đọc");
    }
  }, [markAllAsRead, showError, showSuccess, unreadCount]);

  const handleItemClick = useCallback(
    async (item: NotificationItemDto) => {
      if (item.status === NotificationStatus.UNREAD) {
        markAsRead(item.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((it) =>
            it.id === item.id ? { ...it, status: NotificationStatus.READ } : it
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      const refType = item.meta?.referenceType;
      const refId = item.meta?.referenceId;

      if (!refId) return;

      switch (refType) {
        case "order":
          history.push(`/tabs/orders/detail/${refId}`);
          break;
        case "dmsg_order":
          history.push(`/tabs/orders/dmsg/detail/${refId}`);
          break;
        case "debt":
          history.push(`/tabs/debt/detail/${refId}`);
          break;
        case "product":
        case "inventory":
          history.push(`/tabs/products/detail/${refId}`);
          break;
        case "receipt_import":
          history.push(`/tabs/receipt-import/detail/${refId}`);
          break;
        case "receipt_check":
          history.push(`/tabs/receipt-check/detail/${refId}`);
          break;
        case "customer":
          history.push(`/tabs/extended/customers/detail/${refId}`);
          break;
        case "supplier":
          history.push(`/tabs/extended/suppliers/detail/${refId}`);
          break;
        default:
          break;
      }
    },
    [history, markAsRead]
  );

  const displayedNotifications = useMemo(() => {
    if (category === "all" || category === "unread") {
      return notifications;
    }
    if (category === "order") {
      return notifications.filter(
        (it) =>
          it.meta?.referenceType === "order" ||
          it.meta?.referenceType === "dmsg_order"
      );
    }
    if (category === "inventory") {
      return notifications.filter(
        (it) =>
          it.meta?.referenceType === "product" ||
          it.meta?.referenceType === "inventory"
      );
    }
    if (category === "debt") {
      return notifications.filter(
        (it) =>
          it.meta?.referenceType === "debt" ||
          it.meta?.referenceType === "payment"
      );
    }
    return notifications;
  }, [category, notifications]);

  const filterOptions: FilterTabOption[] = useMemo(
    () => [
      { key: "all", label: "Tất cả" },
      { key: "unread", label: "Chưa đọc", badge: unreadCount },
      { key: "order", label: "Đơn hàng" },
      { key: "inventory", label: "Kho & Hàng" },
      { key: "debt", label: "Công nợ" },
    ],
    [unreadCount]
  );

  return {
    notifications: displayedNotifications,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    category,
    error,
    filterOptions,
    handleRefresh,
    handleLoadMore,
    handleCategoryChange,
    handleMarkAllAsRead,
    handleItemClick,
    retry: () => loadData(1),
  };
};
