export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
}

export interface NotificationMeta {
  referenceId?: string;
  referenceType?: string;
  [key: string]: unknown;
}

export interface NotificationItemDto {
  id: string;
  userId: string;
  title: string;
  body: string;
  status: NotificationStatus;
  meta?: NotificationMeta | null;
  readAt?: string | null;
  createdAt: string;
}

export interface GetNotificationsQueryDto {
  category?: "order" | "inventory" | "debt";
  page?: number;
  limit?: number;
  status?: NotificationStatus;
}

export interface UnreadCountResponseDto {
  count: number;
}
