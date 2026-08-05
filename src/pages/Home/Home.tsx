import { useState } from "react";
// import { Capacitor } from "@capacitor/core";
// import { Toast } from "@capacitor/toast";
// import { PushNotifications } from "@capacitor/push-notifications";
import {
  IonContent,
  IonAvatar,
  IonImg,
  useIonViewWillEnter,
  RefresherEventDetail,
  useIonToast,
} from "@ionic/react";
import "dayjs/locale/vi";

import StatisticCards, {
  StatisticCardsProps,
} from "./components/StatisticCards";
// import ImportantUpdates from "./components/ImportantUpdates";
import RecentActivities from "./components/RecentActivities";
import QuickActions from "./components/QuickActions";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import { Refresher } from "@/components/Refresher/Refresher";
import { AppBadge } from "@/components/UI";

import { useAuth, useLoading } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";
import useReceiptImport from "@/hooks/apis/useReceiptImport";
import useOrder from "@/hooks/apis/useOrder";
import useAggregate from "@/hooks/apis/useAggregate";

import { capitalizeFirstLetter, isHasProperty } from "@/helpers/common";
import { dayjsFormat } from "@/helpers/formatters";

const userMock = {
  avatar: "https://i.pravatar.cc/300",
};

const HomeScreen: React.FC = () => {
  const [presentToast] = useIonToast();
  const { user } = useAuth();
  // const { getItem, addItem } = useStorage();

  const [stats, setStats] = useState<StatisticCardsProps["stats"]>({
    revenue: 0,
    profit: 0,
    orders: 0,
    pendingOrders: 0,
    inventory: 0,
    totalProducts: 0,
    totalImport: 0,
    totalOrders: 0,
  });
  const { isLoading, withLoading } = useLoading();

  const { getTotalProductAndInventory } = useProduct();
  const { getTotalImportsByDateRange } = useReceiptImport();
  const { getTotalOrderByDateRange } = useOrder();
  const { getDailyRevenue } = useAggregate();

  // const registerNotifications = async () => {
  //   let permStatus = await PushNotifications.checkPermissions();
  //   console.log({ permStatus });

  //   if (permStatus.receive === "prompt") {
  //     permStatus = await PushNotifications.requestPermissions();
  //     console.log({ permStatus });
  //   }

  //   if (permStatus.receive !== "granted") {
  //     throw new Error("User denied permissions!");
  //   }

  //   // Register with FCM
  //   await PushNotifications.register();
  // };

  // const requestPushPermission = async () => {
  //   try {
  //     const platform = Capacitor.getPlatform();

  //     if (platform === "web") {
  //       if (!("Notification" in window)) {
  //         await Toast.show({
  //           text: "Thông báo không được hỗ trợ trên trình duyệt",
  //           duration: "short",
  //           position: "center",
  //         });
  //         return;
  //       }

  //       const newPermission = await Notification.requestPermission();
  //       console.log({ newPermission });

  //       presentToast({
  //         message: JSON.stringify(newPermission),
  //         duration: 2000,
  //         position: "top",
  //         color: "success",
  //       });

  //       return;
  //     }

  //     // Check if permission was already requested
  //     const permissionStatus = await getItem("pushPermissionRequested");
  //     console.log({ permissionStatus });
  //     // if (permissionStatus === "true") return;

  //     await registerNotifications();

  //     // Mark that we've requested permission
  //     await addItem("pushPermissionRequested", "true");

  //     // Add listeners for push events if needed
  //     PushNotifications.addListener("registration", (token) => {
  //       console.log("Push registration success: ", token.value);
  //     });

  //     PushNotifications.addListener("registrationError", (err) => {
  //       console.error("Push registration failed: ", err.error);
  //     });
  //   } catch (error) {
  //     console.error("Error requesting push permission:", error);
  //     await presentToast({
  //       message: (error as Error).message,
  //       duration: 2000,
  //       position: "top",
  //       color: "danger",
  //     });
  //   }
  // };

  const fetchHomeData = () => {
    return withLoading(async () => {
      try {
        const [totalImport, totalProductAndInventory, totalOrders, dailyRevenue] =
          await Promise.allSettled([
            await getTotalImportsByDateRange(),
            await getTotalProductAndInventory(),
            await getTotalOrderByDateRange(),
            await getDailyRevenue(),
          ]);

        const statsData: Partial<StatisticCardsProps["stats"]> = {};

        if (totalProductAndInventory.status === "fulfilled") {
          const { totalInventory, totalProduct } =
            totalProductAndInventory.value;
          statsData.inventory = totalInventory;
          statsData.totalProducts = totalProduct;
        }

        if (totalImport.status === "fulfilled") {
          statsData.totalImport = totalImport.value;
        }

        if (totalOrders.status === "fulfilled") {
          statsData.totalOrders = totalOrders.value['totalOrders'];
        }

        if (dailyRevenue.status === "fulfilled") {
          const { totalRevenue, grossProfit } = dailyRevenue.value

          statsData.revenue = totalRevenue;
          statsData.profit = grossProfit
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

      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border border-teal-500/20 rounded-2xl p-4 sm:p-5 mb-6 shadow-xs backdrop-blur-xs">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0 pr-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight mb-1">
                Chào mừng trở lại{" "}
                <span className="text-teal-600 font-extrabold">{user?.fullname || "bạn"}!</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm italic mb-3">
                Một ngày mới thật đẹp bạn nhé
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <AppBadge color="success" variant="soft" className="px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                  Hoạt động
                </AppBadge>
                <span className="text-gray-500 text-xs italic">
                  {capitalizeFirstLetter(dayjsFormat(new Date(), "dddd, DD MMMM YYYY", "vi"))}
                </span>
              </div>
            </div>
            <IonAvatar className="w-12 h-12 sm:w-14 sm:h-14 ring-2 ring-white shadow-sm flex-shrink-0">
              <IonImg src={userMock.avatar} alt="User avatar" />
            </IonAvatar>
          </div>
        </div>

        <StatisticCards stats={stats} user={user} />
        {/* <ImportantUpdates lowStockCount={3} /> */}
        <QuickActions />
        <RecentActivities />
      </div>
    </IonContent>
  );
};

export default HomeScreen;
