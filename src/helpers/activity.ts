import {
  RecentActivityItemDto,
  UserActivityType,
} from "@/types/activity.type";

const RECEIPT_DEBT_ACTIVITY_TYPES = new Set<UserActivityType>([
  UserActivityType.RECEIPT_DEBT_CREATED,
  UserActivityType.RECEIPT_DEBT_UPDATED,
  UserActivityType.RECEIPT_DEBT_PAID,
]);

export const getActivityRoute = (
  activity: Pick<RecentActivityItemDto, "type" | "referenceId">
): string | null => {
  if (!activity.referenceId) return null;

  if (RECEIPT_DEBT_ACTIVITY_TYPES.has(activity.type as UserActivityType)) {
    return `/tabs/debt/detail/${activity.referenceId}`;
  }

  return null;
};
