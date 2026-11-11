import { NotificationItemDto, NotificationStatus } from "@/types/notification.type";

export type NotificationCategory = "all" | "unread" | "order" | "inventory" | "debt";

export interface FilterTabOption {
  key: NotificationCategory;
  label: string;
  badge?: number;
}
export type { NotificationItemDto };
export { NotificationStatus };
