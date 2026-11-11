import React from "react";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { checkmarkDoneOutline, refreshOutline } from "ionicons/icons";
import AppButton from "@/components/UI/AppButton";
import { Refresher } from "@/components/Refresher/Refresher";
import NotificationFilterTabs from "./components/NotificationFilterTabs";
import NotificationItemCard from "./components/NotificationItemCard";
import NotificationEmptyState from "./components/NotificationEmptyState";
import NotificationSkeleton from "./components/NotificationSkeleton";
import { useNotificationList } from "./hooks/useNotificationList";

const NotificationListPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
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
    retry,
  } = useNotificationList();

  const onRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await handleRefresh();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="font-semibold text-gray-900">Thông báo</IonTitle>
          <IonButtons slot="end">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 active:opacity-70 transition-all rounded-lg"
              >
                <IonIcon icon={checkmarkDoneOutline} className="text-base" />
                <span>Đọc tất cả</span>
              </button>
            )}
          </IonButtons>
        </IonToolbar>

        <NotificationFilterTabs
          current={category}
          options={filterOptions}
          onChange={handleCategoryChange}
        />
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={onRefresh} />

        <div className="max-w-2xl mx-auto py-2">
          {loading && <NotificationSkeleton count={5} />}

          {!loading && error && notifications.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-red-600 mb-4">{error}</p>
              <AppButton
                variant="outline"
                size="small"
                onClick={retry}
                icon={<IonIcon icon={refreshOutline} className="text-base" />}
              >
                Thử lại
              </AppButton>
            </div>
          )}

          {!loading && !error && notifications.length === 0 && (
            <NotificationEmptyState category={category} />
          )}

          {!loading && notifications.length > 0 && (
            <div className="space-y-3 px-4 py-2">
              {notifications.map((item) => (
                <NotificationItemCard
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                />
              ))}

              {hasMore && (
                <div className="flex justify-center pt-3 pb-8">
                  <AppButton
                    variant="pill"
                    size="small"
                    loading={loadingMore}
                    loadingText="Đang tải..."
                    onClick={handleLoadMore}
                  >
                    Xem thêm thông báo
                  </AppButton>
                </div>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default NotificationListPage;
