import React from "react";
import { IonIcon } from "@ionic/react";
import { notificationsOutline } from "ionicons/icons";

interface NotificationEmptyStateProps {
  category?: string;
}

const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({
  category = "all",
}) => {
  const getMessage = () => {
    switch (category) {
      case "unread":
        return {
          title: "Không có thông báo chưa đọc",
          description: "Tuyệt vời! Bạn đã đọc toàn bộ thông báo hệ thống.",
        };
      case "order":
        return {
          title: "Chưa có thông báo đơn hàng",
          description: "Thông báo về đơn hàng mới sẽ xuất hiện tại đây khi được tạo.",
        };
      case "inventory":
        return {
          title: "Chưa có cảnh báo kho",
          description: "Các cảnh báo về tồn kho thấp hoặc hết hàng sẽ hiển thị tại đây.",
        };
      case "debt":
        return {
          title: "Chưa có nhắc nhở công nợ",
          description: "Các khoản nợ sắp đến hạn sẽ được nhắc nhở tại đây.",
        };
      default:
        return {
          title: "Chưa có thông báo nào",
          description:
            "Các thông báo về đơn hàng, kho và hoạt động quan trọng sẽ xuất hiện tại đây.",
        };
    }
  };

  const { title, description } = getMessage();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-4 shadow-sm">
        <IonIcon icon={notificationsOutline} className="text-3xl" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default NotificationEmptyState;
