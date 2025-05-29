import React, { useEffect, useState } from "react";
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonList,
  IonListHeader,
} from "@ionic/react";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { useStorage } from "../hooks/useStorage";

const NotificationSettings: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const { storage } = useStorage();

  useEffect(() => {
    const checkPermission = async () => {
      if (Capacitor.getPlatform() === "web") return;

      try {
        const permissionStatus = await storage?.get("pushPermissionRequested");
        setEnabled(permissionStatus === "true");
      } catch (error) {
        console.error("Error checking permission:", error);
      }
    };

    checkPermission();
  }, []);

  const toggleNotifications = async () => {
    if (Capacitor.getPlatform() === "web") {
      await Toast.show({
        text: "Push notifications are not available in web browser",
        duration: "short",
        position: "center",
      });
      return;
    }

    try {
      if (!enabled) {
        // Enable notifications
        await PushNotifications.register();
        await storage?.set("pushPermissionRequested", "true");
        setEnabled(true);

        await Toast.show({
          text: "Thông báo đã được bật",
          duration: "short",
          position: "center",
        });
      } else {
        // For disabling, we can't actually revoke permission, but we can guide the user
        await Toast.show({
          text: "Vui lòng tắt thông báo trong cài đặt thiết bị",
          duration: "long",
          position: "center",
        });
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    }
  };

  return (
    <IonList>
      <IonListHeader>Cài đặt thông báo</IonListHeader>
      <IonItem>
        <IonLabel>Nhận thông báo đẩy</IonLabel>
        <IonToggle
          checked={enabled}
          onIonChange={toggleNotifications}
          enableOnOffLabels={true}
        />
      </IonItem>
    </IonList>
  );
};

export default NotificationSettings;
