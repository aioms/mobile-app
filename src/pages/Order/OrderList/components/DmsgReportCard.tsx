import { useEffect, useMemo, useState } from "react";
import { IonButton, IonSpinner, useIonViewWillEnter } from "@ionic/react";
import { AppCard } from "@/components/UI";
import useDmsgOrder from "@/hooks/apis/useDmsgOrder";
import { formatCurrency } from "@/helpers/formatters";
import type { DmsgSummary } from "@/types/dmsg.type";
import { useAuth } from "@/hooks";
import { UserRole } from "@/common/enums/user";

interface DmsgReportCardProps {
  embedded?: boolean;
}

export default function DmsgReportCard({ embedded = false }: DmsgReportCardProps) {
  const { user } = useAuth();
  const canManageDmsg = useMemo(() => {
    if (!user?.role) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER].includes(user.role);
  }, [user?.role]);

  const { report } = useDmsgOrder();
  const [value, setValue] = useState<DmsgSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(true);

  async function load() {
    if (!canManageDmsg) return;
    setLoading(true);
    setError("");
    try {
      const day = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
      setValue(await report(`${day}T00:00:00+07:00`, `${day}T23:59:59+07:00`));
    } catch (cause) {
      const err = cause as Error & { statusCode?: number };
      if (err.message?.includes("Không có quyền") || err.message?.includes("403") || err.statusCode === 403) {
        setHasPermission(false);
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManageDmsg) {
      void load();
    }
  }, [canManageDmsg]);

  useIonViewWillEnter(() => {
    if (canManageDmsg) {
      void load();
    }
  });

  if (!canManageDmsg || !hasPermission) return null;

  const content = (
    <>
      <div className="flex justify-between gap-2 items-center mb-2">
        <h2 className="font-bold text-sm">ĐMSG hôm nay</h2>
        <IonButton fill="clear" size="small" onClick={() => { void load(); }}>
          Làm mới
        </IonButton>
      </div>
      {loading ? (
        <IonSpinner name="crescent" />
      ) : error ? (
        <div role="alert" className="text-sm text-red-600">
          {error}
          <IonButton fill="clear" onClick={() => { void load(); }}>
            Thử lại
          </IonButton>
        </div>
      ) : !value?.count ? (
        <div className="text-sm text-gray-500">
          Chưa có đơn ĐMSG hoàn thành hôm nay.
          <IonButton fill="clear" size="small" routerLink="/tabs/orders/dmsg/create">
            Tạo đơn ĐMSG
          </IonButton>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Doanh thu ({value.count} đơn)</p>
              <strong className="text-blue-600 text-sm" data-cy="dmsg-daily-revenue">
                {formatCurrency(value.revenue)}
              </strong>
            </div>
            <div className="border-l pl-3">
              <p className="text-xs text-gray-500">Lợi nhuận</p>
              <strong
                className={`text-sm ${value.profit < 0 ? "text-red-600" : "text-green-600"}`}
                data-cy="dmsg-daily-profit"
              >
                {formatCurrency(value.profit)}
              </strong>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Theo ngày hoàn thành; nháp chưa tính. Tiền khách chuyển theo dõi riêng.
          </p>
        </>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="pt-2.5 mt-2.5 border-t border-gray-100" data-cy="dmsg-daily-report">
        {content}
      </div>
    );
  }

  return (
    <AppCard className="mx-4" data-cy="dmsg-daily-report">
      {content}
    </AppCard>
  );
}
