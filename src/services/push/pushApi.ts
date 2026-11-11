import { request } from "@/helpers/axios";
import type {
  PushPublicKeyDto,
  PushSubscriptionPayload,
  PushSubscriptionResult,
} from "@/types/push.type";

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
  success?: boolean;
}

export const fetchPushPublicKey = async (): Promise<PushPublicKeyDto> => {
  const response = (await request.get(
    "/push/public-key"
  )) as ApiEnvelope<PushPublicKeyDto>;

  return (
    response?.data ?? { publicKey: null, configured: false }
  );
};

export const registerPushSubscription = async (
  payload: PushSubscriptionPayload
): Promise<PushSubscriptionResult | null> => {
  const response = (await request.post(
    "/push/subscriptions",
    payload
  )) as ApiEnvelope<PushSubscriptionResult>;

  return response?.success ? response.data ?? null : null;
};

export const removePushSubscription = async (
  endpoint: string
): Promise<PushSubscriptionResult | null> => {
  const response = (await request.delete("/push/subscriptions", {
    data: { endpoint },
  })) as ApiEnvelope<PushSubscriptionResult>;

  return response?.success ? response.data ?? null : null;
};

export const sendTestPushNotification = async (): Promise<boolean> => {
  const response = (await request.post("/push/test")) as ApiEnvelope<unknown>;
  return Boolean(response?.success);
};
