import { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { cart, analytics, fileTray } from "ionicons/icons";

import { UserRole } from "@/common/enums/user";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import type { User } from "@/types/index.d";

export interface StatisticCardsProps {
  user: User | null;
  stats: {
    revenue: number;
    profit: number;
    orders: number;
    pendingOrders: number;
    inventory: number;
    totalProducts: number;
    totalImport: number;
    totalOrders: number;
  };
}

const StatisticCards: React.FC<StatisticCardsProps> = ({ user, stats }) => {
  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER].includes(user.role);
  }, [user?.role]);

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {isAdmin && (
        <div className="bg-white rounded-xl p-3">
          <h3 className="text-gray-500 text-xs mb-1">Doanh Thu Hôm Nay</h3>
          <div className="text-lg font-bold flex items-center">
            {formatCurrencyWithoutSymbol(stats.revenue)}
            <IonIcon icon={analytics} color="success" className="ml-1" />
          </div>
          <div className="text-green-500 text-xs">
            Lợi nhuận {formatCurrencyWithoutSymbol(stats.profit)}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-3">
        <h3 className="text-gray-500 text-xs mb-1"> Đơn nhập </h3>
        <div className="text-lg font-bold flex items-center">
          {stats.totalImport}
          <IonIcon icon={fileTray} color="secondary" className="ml-1" />
        </div>
      </div>

      <div className="bg-white rounded-xl p-3">
        <h3 className="text-gray-500 text-xs mb-1">Đơn hàng</h3>
        <div className="text-lg font-bold flex items-center">
          {stats.totalOrders}
          <IonIcon icon={cart} color="secondary" className="ml-1" />
        </div>
        <div className="text-gray-500 text-xs">
          Trả hàng {stats.pendingOrders}
        </div>
      </div>

      <div className="bg-white rounded-xl p-3">
        <h3 className="text-gray-500 text-xs mb-1">Tồn kho</h3>
        <div className="text-lg font-bold flex items-center">
          {formatCurrencyWithoutSymbol(stats.inventory)}
        </div>
        <div className="text-gray-500 text-xs">
          Mặt hàng: {formatCurrencyWithoutSymbol(stats.totalProducts)}
        </div>
      </div>
    </div>
  );
};

export default StatisticCards;
