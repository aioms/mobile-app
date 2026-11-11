import { useCallback, useEffect, useState } from "react";
import type { PushPermissionStatus } from "@/types/push.type";
import {
  disablePush,
  enablePush,
  getPushStatus,
  isPushSupported,
} from "@/services/push/pushClient";
import { sendTestPushNotification } from "@/services/push/pushApi";

interface UsePushNotificationsResult {
  status: PushPermissionStatus;
  isLoading: boolean;
  isToggling: boolean;
  isTesting: boolean;
  error: string | null;
  supported: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  sendTest: () => Promise<boolean>;
}

export const usePushNotifications = (): UsePushNotificationsResult => {
  const supported = isPushSupported();
  const [status, setStatus] = useState<PushPermissionStatus>(
    supported ? "idle" : "unsupported"
  );
  const [isLoading, setIsLoading] = useState(supported);
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supported) return;
    let active = true;

    getPushStatus()
      .then((next) => {
        if (active) setStatus(next);
      })
      .catch(() => {
        if (active) setError("Không đọc được trạng thái thông báo đẩy");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [supported]);

  const enable = useCallback(async () => {
    setIsToggling(true);
    setError(null);
    try {
      await enablePush();
      setStatus(await getPushStatus());
    } catch (enableError) {
      setError(
        enableError instanceof Error
          ? enableError.message
          : "Không thể bật thông báo đẩy"
      );
      setStatus(await getPushStatus());
    } finally {
      setIsToggling(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setIsToggling(true);
    setError(null);
    try {
      await disablePush();
      setStatus(await getPushStatus());
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "Không thể tắt thông báo đẩy"
      );
    } finally {
      setIsToggling(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setIsTesting(true);
    setError(null);
    try {
      const sent = await sendTestPushNotification();
      if (!sent) setError("Không gửi được thông báo thử");
      return sent;
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    status,
    isLoading,
    isToggling,
    isTesting,
    error,
    supported,
    enable,
    disable,
    sendTest,
  };
};
