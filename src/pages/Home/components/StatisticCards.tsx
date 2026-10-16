import { useMemo } from "react";
import { IonIcon } from "@ionic/react";
import { cart, analytics, fileTray, cubeOutline } from "ionicons/icons";

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

interface StatCardItem {
  id: string;
  title: string;
  value: string | number;
  subtitle: React.ReactNode;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const StatisticCards: React.FC<StatisticCardsProps> = ({ user, stats }) => {
  const isAdmin = useMemo(() => {
    if (!user || !user.role) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER].includes(user.role);
  }, [user?.role]);

  const cards = useMemo<StatCardItem[]>(() => {
    const list: StatCardItem[] = [];

    if (isAdmin) {
      list.push({
        id: "revenue",
        title: "Doanh Thu Hôm Nay",
        value: formatCurrencyWithoutSymbol(stats.revenue),
        subtitle: (
          <span className="text-emerald-600 text-[11px] leading-tight font-medium">
            Lợi nhuận gộp: {formatCurrencyWithoutSymbol(stats.profit)}
          </span>
        ),
        icon: analytics,
        iconBg: "bg-emerald-50",
        iconColor: "text-emerald-600",
      });
    }

    list.push({
      id: "import",
      title: "Đơn nhập",
      value: stats.totalImport,
      subtitle: <span className="text-gray-400 text-xs">Phiếu đã tạo</span>,
      icon: fileTray,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    });

    list.push({
      id: "orders",
      title: "Đơn hàng",
      value: stats.totalOrders,
      subtitle: (
        <span className="text-gray-500 text-xs truncate block">
          Trả hàng: <span className="font-medium text-gray-700">{stats.pendingOrders}</span>
        </span>
      ),
      icon: cart,
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    });

    list.push({
      id: "inventory",
      title: "Tồn kho",
      value: formatCurrencyWithoutSymbol(stats.inventory),
      subtitle: (
        <span className="text-gray-500 text-xs truncate block">
          Mặt hàng: <span className="font-medium text-gray-700">{formatCurrencyWithoutSymbol(stats.totalProducts)}</span>
        </span>
      ),
      icon: cubeOutline,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    });

    return list;
  }, [isAdmin, stats]);

  // Dynamic grid setup based on visible card count:
  // - 1 card: 1 column
  // - 2 cards: 2 columns
  // - 3 cards: 2 cols on mobile (1 & 2 in row 1, 3 spans row 2) -> 3 cols on sm+ (all 3 in 1 row)
  // - 4 cards: 2 cols on mobile (2x2) -> 4 cols on lg+
  const containerGridClass = useMemo(() => {
    switch (cards.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2 sm:grid-cols-3";
      case 4:
        return "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";
      default:
        return "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";
    }
  }, [cards.length]);

  return (
    <div className={`grid ${containerGridClass} gap-3 sm:gap-4 mb-6`}>
      {cards.map((card, index) => {
        // When cards count is odd (e.g. 3 cards), the last card spans 2 columns on mobile,
        // and returns to 1 column on sm+ where the grid has 3 columns.
        const isLastOdd = cards.length % 2 === 1 && index === cards.length - 1;

        if (isLastOdd) {
          return (
            <div
              key={card.id}
              className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Mobile layout: wide horizontal presentation with badge */}
              <div className="flex sm:hidden items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <IonIcon icon={card.icon} className="text-base" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-gray-500 text-xs font-medium truncate">{card.title}</h3>
                    <div className="text-base font-bold text-gray-900 tracking-tight truncate">
                      {card.value}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                  <div className="text-[11px] text-gray-600 bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-100 font-medium">
                    {card.subtitle}
                  </div>
                </div>
              </div>

              {/* Tablet/Desktop (sm+) layout: standard vertical card */}
              <div className="hidden sm:flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="text-gray-500 text-xs font-medium truncate">{card.title}</h3>
                  <div className={`w-7 h-7 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                    <IonIcon icon={card.icon} className="text-base" />
                  </div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                    {card.value}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {card.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={card.id}
            className="col-span-1 bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow min-h-[92px]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-gray-500 text-xs font-medium truncate">{card.title}</h3>
              <div className={`w-7 h-7 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                <IonIcon icon={card.icon} className="text-base" />
              </div>
            </div>
            <div>
              <div className="text-base sm:text-lg font-bold text-gray-900 tracking-tight truncate">
                {card.value}
              </div>
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {card.subtitle}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatisticCards;
