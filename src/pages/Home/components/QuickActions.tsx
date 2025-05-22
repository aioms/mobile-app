import { IonIcon } from "@ionic/react";
import { 
  scanOutline, 
  cartOutline,
  statsChartOutline,
  timeOutline
} from "ionicons/icons";

const QuickActions: React.FC = () => {
  const actions = [
    {
      icon: scanOutline,
      label: "Quét sản phẩm",
      color: "bg-blue-500",
      route: "/scan"
    },
    {
      icon: cartOutline,
      label: "Tạo đơn hàng",
      color: "bg-orange-500",
      route: "/create-order"
    },
    {
      icon: statsChartOutline,
      label: "Phân tích báo cáo",
      color: "bg-green-500",
      route: "/analytics"
    },
    {
      icon: timeOutline,
      label: "Chấm công",
      color: "bg-blue-500",
      route: "/attendance"
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3">Thao tác nhanh</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <div 
            key={index}
            className="bg-white rounded-xl p-4 flex items-center justify-center flex-col"
          >
            <div className={`${action.color} p-2 rounded-lg mb-2`}>
              <IonIcon 
                icon={action.icon} 
                className="text-white w-6 h-6"
              />
            </div>
            <span className="text-xs">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
