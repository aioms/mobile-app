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
    <div className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "sm:grid-cols-3"} gap-3 sm:gap-4 mb-6`}>
      {isAdmin && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-gray-500 text-xs font-medium truncate">Doanh Thu Hôm Nay</h3>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={analytics} className="text-base" />
            </div>
          </div>
          <div>
            <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
              {formatCurrencyWithoutSymbol(stats.revenue)}
            </div>
            <div className="text-emerald-600 text-xs font-medium mt-0.5 truncate">
              Lợi nhuận: {formatCurrencyWithoutSymbol(stats.profit)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-gray-500 text-xs font-medium truncate">Đơn nhập</h3>
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={fileTray} className="text-base" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            {stats.totalImport}
          </div>
          <div className="text-gray-400 text-xs mt-0.5">Phiếu đã tạo</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-gray-500 text-xs font-medium truncate">Đơn hàng</h3>
          <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={cart} className="text-base" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            {stats.totalOrders}
          </div>
          <div className="text-gray-500 text-xs mt-0.5 truncate">
            Trả hàng: <span className="font-medium text-gray-700">{stats.pendingOrders}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-gray-500 text-xs font-medium truncate">Tồn kho</h3>
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <IonIcon icon={cart} className="text-base" />
          </div>
        </div>
        <div>
          <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
            {formatCurrencyWithoutSymbol(stats.inventory)}
          </div>
          <div className="text-gray-500 text-xs mt-0.5 truncate">
            Mặt hàng: <span className="font-medium text-gray-700">{formatCurrencyWithoutSymbol(stats.totalProducts)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticCards;
