import { useEffect, useState } from "react";
import { useHistory, useLocation } from "react-router";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonBackButton, IonButtons, IonSpinner } from "@ionic/react";
import useReminders, { type ReminderRow } from "@/hooks/apis/useReminders";
import { Refresher } from "@/components/Refresher/Refresher";
const routes: Record<string, string> = { order: "/tabs/orders/detail/", dmsg_order: "/tabs/orders/dmsg/detail/", debt: "/tabs/debt/detail/", receipt_import: "/tabs/receipt-import/detail/" };
export default function Reminders() {
  const history = useHistory(), location = useLocation(), fetchRows = useReminders();
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [page, setPage] = useState(1), [more, setMore] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  async function load(next = 1) {
    setBusy(true); setError("");
    try { const data = await fetchRows(location.search, next); setRows((old) => next === 1 ? data : [...old, ...data]); setPage(next); setMore(data.length === 50); }
    catch (cause) { setError((cause as Error).message); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, [location.search, fetchRows]);
  return <IonPage><IonHeader><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/tabs/notification" /></IonButtons><IonTitle>Việc cần xử lý</IonTitle></IonToolbar></IonHeader>
    <IonContent><Refresher onRefresh={async (event) => { await load(); event.detail.complete(); }} />
      <div className="p-4 max-w-2xl mx-auto"><p className="text-sm text-gray-500 mb-3">Danh sách hiện tại theo bộ lọc lúc nhắc; việc đã xử lý sẽ được bỏ khỏi danh sách.</p>
        {error && <div role="alert">{error}<IonButton onClick={() => void load()}>Thử lại</IonButton></div>}
        {busy && <IonSpinner />}
        {!busy && !error && !rows.length && <div>Đã xử lý hết công việc.<IonButton routerLink="/tabs/notification">Về thông báo</IonButton></div>}
        {rows.map((row) => <button key={row.id} className="w-full min-h-11 text-left border-b py-4" onClick={() => history.push(routes[row.referenceType] + row.id)}>{row.code} · {row.status === "waiting" ? "Chờ duyệt" : row.status === "processing" ? "Đang xử lý" : row.status === "draft" ? "Nháp" : "Chưa thu đủ"}</button>)}
        {more && <IonButton disabled={busy} onClick={() => void load(page + 1)}>Xem thêm</IonButton>}
      </div>
    </IonContent></IonPage>;
}
