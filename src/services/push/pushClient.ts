import { isWeb } from "@/helpers/common";
import type {
  PushPermissionStatus,
  PushSubscriptionPayload,
} from "@/types/push.type";
import {
  fetchPushPublicKey,
  registerPushSubscription,
  removePushSubscription,
} from "./pushApi";

/**
 * Web Push is only reachable from a browser/PWA. Capacitor WebViews (iOS and
 * Android) do not implement PushManager, so the toggle stays hidden there.
 */
export const isPushSupported = (): boolean =>
  isWeb() &&
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  typeof window !== "undefined" &&
  "PushManager" in window &&
  "Notification" in window;

const base64UrlToUint8Array = (value: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));

  for (let index = 0; index < raw.length; index += 1) {
    output[index] = raw.charCodeAt(index);
  }

  return output;
};

const toPayload = (
  subscription: PushSubscription
): PushSubscriptionPayload | null => {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return null;

  return {
    endpoint: json.endpoint,
    keys: { p256dh, auth },
    userAgent: navigator.userAgent.slice(0, 512),
  };
};

const getRegistration = async (): Promise<ServiceWorkerRegistration> =>
  await navigator.serviceWorker.ready;

export const getPushStatus = async (): Promise<PushPermissionStatus> => {
  if (!isPushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "idle";
};

export const enablePush = async (): Promise<void> => {
  if (!isPushSupported()) {
    throw new Error("Trình duyệt không hỗ trợ thông báo đẩy");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Bạn cần cho phép thông báo trên trình duyệt");
  }

  const { publicKey } = await fetchPushPublicKey();
  if (!publicKey) {
    throw new Error("Máy chủ chưa cấu hình thông báo đẩy (VAPID)");
  }

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription() ??
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(publicKey),
    });

  const payload = toPayload(subscription);
  if (!payload) {
    throw new Error("Không đọc được thông tin đăng ký của thiết bị");
  }

  const result = await registerPushSubscription(payload);
  if (!result) {
    throw new Error("Không thể lưu đăng ký thông báo trên máy chủ");
  }
};

export const disablePush = async (): Promise<void> => {
  if (!isPushSupported()) return;

  const registration = await getRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await removePushSubscription(endpoint);
};

/**
 * Re-registers an existing browser subscription with the backend. Browsers keep
 * the subscription across sessions while the server row can be lost (DB reset,
 * account switch), so this runs once on app start.
 */
export const syncPushSubscription = async (): Promise<void> => {
  if (!isPushSupported() || Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const payload = toPayload(subscription);
  if (payload) await registerPushSubscription(payload);
};
