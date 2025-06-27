import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { PushNotifications } from "@capacitor/push-notifications";
import {
  IonContent,
  IonAvatar,
  IonImg,
  useIonViewWillEnter,
  RefresherEventDetail,
  useIonToast,
} from "@ionic/react";
import dayjs from "dayjs";
import "dayjs/locale/vi";

import StatisticCards, {
  StatisticCardsProps,
} from "./components/StatisticCards";
import ImportantUpdates from "./components/ImportantUpdates";
import QuickActions from "./components/QuickActions";
import RecentActivities from "./components/RecentActivities";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import { Refresher } from "@/components/Refresher/Refresher";

import { useAuth, useLoading, useStorage } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";
import useReceiptImport from "@/hooks/apis/useReceiptImport";

import { capitalizeFirstLetter, isHasProperty } from "@/helpers/common";
import { dayjsFormat } from "@/helpers/formatters";

const userMock = {
  avatar: "https://i.pravatar.cc/300",
};

const HomeScreen: React.FC = () => {
  const [presentToast] = useIonToast();
  const { user } = useAuth();
  const { getItem, addItem } = useStorage();

  const [stats, setStats] = useState<StatisticCardsProps["stats"]>({
    revenue: 0,
    profit: 0,
    orders: 0,
    pendingOrders: 0,
    inventory: 0,
    totalProduct: 0,
    totalImport: 0,
  });
  const { isLoading, withLoading } = useLoading();

  const { getTotalProductAndInventory } = useProduct();
  const { getTotalImportsByDateRange } = useReceiptImport();

  const registerNotifications = async () => {
    let permStatus = await PushNotifications.checkPermissions();
    console.log({ permStatus });

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
      console.log({ permStatus });
    }

    if (permStatus.receive !== "granted") {
      throw new Error("User denied permissions!");
    }

    // Register with FCM
    await PushNotifications.register();
  };

  const requestPushPermission = async () => {
    try {
      const platform = Capacitor.getPlatform();

      if (platform === "web") {
        if (!("Notification" in window)) {
          await Toast.show({
            text: "Thông báo không được hỗ trợ trên trình duyệt",
            duration: "short",
            position: "center",
          });
          return;
        }

        const newPermission = await Notification.requestPermission();
        console.log({ newPermission });

        presentToast({
          message: JSON.stringify(newPermission),
          duration: 2000,
          position: "top",
          color: "success",
        });

        return;
      }

      // Check if permission was already requested
      const permissionStatus = await getItem("pushPermissionRequested");
      console.log({ permissionStatus });
      // if (permissionStatus === "true") return;

      await registerNotifications();

      // Mark that we've requested permission
      await addItem("pushPermissionRequested", "true");

      // Add listeners for push events if needed
      PushNotifications.addListener("registration", (token) => {
        console.log("Push registration success: ", token.value);
      });

      PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration failed: ", err.error);
      });
    } catch (error) {
      console.error("Error requesting push permission:", error);
      await presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const fetchHomeData = () => {
    return withLoading(async () => {
      try {
        // await requestPushPermission();

        const [totalImport, totalProductAndInventory] =
          await Promise.allSettled([
            await getTotalImportsByDateRange(),
            await getTotalProductAndInventory(),
          ]);

        const statsData: Partial<StatisticCardsProps["stats"]> = {};

        if (totalProductAndInventory.status === "fulfilled") {
          const { totalInventory, totalProduct } =
            totalProductAndInventory.value;
          statsData.inventory = totalInventory;
          statsData.totalProduct = totalProduct;
        }

        if (totalImport.status === "fulfilled") {
          statsData.totalImport = totalImport.value;
        }

        if (isHasProperty(statsData)) {
          setStats((prev) => ({
            ...prev,
            ...statsData,
          }));
        }
      } catch (error) {
        const err = error as Error;
        await presentToast({
          message: err.message,
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  useIonViewWillEnter(() => {
    fetchHomeData();
  }, []);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchHomeData().finally(() => {
      event.detail.complete();
    });
  };

  return (
    <IonContent className="ion-padding">
      {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
      <Refresher onRefresh={handleRefresh} />

      {/* Header Section */}
      <div className="bg-teal-100/60 text-teal-500 backdrop-blur-sm rounded-2xl p-4 mb-6">
        <div className="flex justify-between items-start">
          <div className="pr-1">
            <h1 className="text-[24px] font-bold mb-2">
              Chào mừng trở lại
              <p>{user?.fullname}! </p>
            </h1>
            <h5 className="text-gray-500 text-sm italic mb-2">
              Một ngày mới thật đẹp bạn nhé
            </h5>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="inline-flex items-center px-2 py-1 bg-green-50 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                <span className="text-green-700 text-xs font-medium">
                  Hoạt động
                </span>
              </div>
              <span className="text-gray-600 text-xs italic">
                {capitalizeFirstLetter(dayjsFormat(new Date(), "dddd, DD MMMM YYYY", "vi"))}
              </span>
            </div>
          </div>
          <IonAvatar className="w-13 h-13 ring-2 ring-white">
            <IonImg src={userMock.avatar} alt="User avatar" />
          </IonAvatar>
        </div>
      </div>

      <StatisticCards stats={stats} user={user} />
      <ImportantUpdates lowStockCount={3} />
      <QuickActions />
      <RecentActivities />
    </IonContent>
  );
};

export default HomeScreen;
