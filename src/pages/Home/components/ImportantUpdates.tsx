import { IonIcon } from "@ionic/react";
import { alertCircleOutline, chevronForward } from "ionicons/icons";

interface ImportantUpdatesProps {
  lowStockCount: number;
}

const ImportantUpdates: React.FC<ImportantUpdatesProps> = ({
  lowStockCount,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3">Cập nhật quan trọng</h2>
      <div className="bg-red-50 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-1.5 rounded-lg">
            <IonIcon
              icon={alertCircleOutline}
              className="text-red-500 w-5 h-5"
            />
          </div>
          <div>
            <h3 className="text-sm">Sắp hết hàng {lowStockCount} sản phẩm</h3>
            <span className="text-red-500 text-xs">Chi tiết</span>
          </div>
        </div>
        <IonIcon icon={chevronForward} className="text-gray-400 w-5 h-5" />
      </div>
    </div>
  );
};

export default ImportantUpdates;
