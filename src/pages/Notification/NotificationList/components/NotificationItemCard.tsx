import React from "react";
import { IonIcon } from "@ionic/react";
import {
  cartOutline,
  cubeOutline,
  cardOutline,
  notificationsOutline,
  chevronForwardOutline,
} from "ionicons/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/vi";
import { NotificationItemDto, NotificationStatus } from "../types";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("vi");

interface NotificationItemCardProps {
  item: NotificationItemDto;
  onClick: (item: NotificationItemDto) => void;
}

const getCategoryStyle = (referenceType?: string) => {
  switch (referenceType) {
    case "order":
    case "dmsg_order":
      return {
        icon: cartOutline,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
      };
    case "product":
    case "inventory":
      return {
        icon: cubeOutline,
        bgColor: "bg-amber-50",
        textColor: "text-amber-600",
      };
    case "debt":
    case "payment":
      return {
        icon: cardOutline,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-600",
      };
    default:
      return {
        icon: notificationsOutline,
        bgColor: "bg-gray-100",
        textColor: "text-gray-600",
      };
  }
};

const NotificationItemCard: React.FC<NotificationItemCardProps> = ({
  item,
  onClick,
}) => {
  const isUnread = item.status === NotificationStatus.UNREAD;
  const style = getCategoryStyle(item.meta?.referenceType);
  const timeLabel = dayjs(item.createdAt).fromNow();

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={`w-full text-left rounded-2xl border p-4 shadow-sm transition-all active:scale-[0.99] flex items-start gap-3.5 ${
        isUnread
          ? "bg-blue-50/40 border-blue-200 border-l-4 border-l-blue-600"
          : "bg-white border-gray-100 border-l-4 border-l-transparent hover:border-gray-200"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.bgColor} ${style.textColor}`}
      >
        <IonIcon icon={style.icon} className="text-xl" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            )}
            <h4
              className={`text-sm truncate ${
                isUnread
                  ? "font-semibold text-gray-900"
                  : "font-medium text-gray-800"
              }`}
            >
              {item.title}
            </h4>
          </div>
          <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
            {timeLabel}
          </span>
        </div>

        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {item.body}
        </p>
      </div>

      <IonIcon
        icon={chevronForwardOutline}
        className="text-gray-300 text-sm shrink-0 self-center"
      />
    </button>
  );
};

export default NotificationItemCard;
