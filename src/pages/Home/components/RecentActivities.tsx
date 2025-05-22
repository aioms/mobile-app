import { IonIcon } from "@ionic/react";
import { checkmarkCircle, cubeOutline, pricetagOutline } from "ionicons/icons";

const RecentActivities: React.FC = () => {
  const activities = [
    {
      icon: checkmarkCircle,
      color: "text-blue-500",
      title: "Đơn hàng #0001 vừa hoàn thành",
      time: "2 mins ago",
    },
    {
      icon: cubeOutline,
      color: "text-blue-500",
      title: "Đã nhập kho phiếu NH010325",
      time: "1 hour ago",
    },
    {
      icon: pricetagOutline,
      color: "text-blue-500",
      title: "Đã cập nhật giá bán cho sản phẩm A",
      time: "2 hours ago",
    },
  ];

  return (
    <div>
      <h2 className="text-base font-bold mb-3">Hoạt động mới nhất</h2>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <IonIcon
                icon={activity.icon}
                className={`${activity.color} w-5 h-5`}
              />
            </div>
            <div>
              <h3 className="text-sm">{activity.title}</h3>
              <span className="text-gray-500 text-xs">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;
