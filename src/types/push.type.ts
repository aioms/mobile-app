export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export interface PushPublicKeyDto {
  publicKey: string | null;
  configured: boolean;
}

export type PushPermissionStatus =
  | "unsupported"
  | "idle"
  | "subscribed"
  | "denied";

export interface PushSubscriptionResult {
  devices: number;
}
