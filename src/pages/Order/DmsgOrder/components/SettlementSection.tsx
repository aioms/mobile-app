import { useRef, useState } from "react";
import { IonButton, useIonAlert } from "@ionic/react";
import { AppCard } from "@/components/UI";
import { useLoading } from "@/hooks";
import useDmsgOrder from "@/hooks/apis/useDmsgOrder";
import type { IOrder } from "@/types/order.type";
import type { DmsgSettlementKind } from "@/types/dmsg.type";
import { formatCurrency } from "@/helpers/formatters";

const labels = { receipt: "Khách chuyển tiền vào", customer_transfer: "Chuyển tiền cho khách", invoice_fee: "Trả phí hóa đơn", refund: "Hoàn tiền đã nhận" };
export default function SettlementSection({ order, reload }: { order: IOrder; reload: () => Promise<void> }) {
  const [kind, setKind] = useState<DmsgSettlementKind>(order.status === "cancelled" ? "refund" : order.totalAmount > (order.dmsgSettlements?.netReceived || 0) ? "receipt" : "customer_transfer");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bank_transfer");
  const [error, setError] = useState("");
  const pending = useRef<{ payload: string; requestId: string }>();
  const locked = useRef(false);
  const { settle } = useDmsgOrder();
  const { isLoading, withLoading } = useLoading();
  const [alert] = useIonAlert();
  const totals = order.dmsgSettlements;
  const received = totals?.netReceived || 0;
  const save = async () => {
    if (locked.current) return;
    const number = Number(amount);
    if (!Number.isSafeInteger(number) || number <= 0) { setError("Nhập số tiền VND nguyên lớn hơn 0"); return; }
    locked.current = true;
    const payload = JSON.stringify({ kind, amount: number, paymentMethod: method });
    if (pending.current?.payload !== payload) pending.current = { payload, requestId: crypto.randomUUID() };
    await withLoading(async () => {
      try {
        await settle(order.id, { kind, amount: number, paymentMethod: method, requestId: pending.current!.requestId });
        pending.current = undefined; setAmount(""); setError(""); await reload();
      } catch (cause) { setError((cause as Error).message); throw cause; }
    });
    locked.current = false;
  };
  return <AppCard>
    <h2 className="text-lg font-bold mb-3">Tiền thực thu / chi</h2>
    <div className="space-y-2 text-sm">
      {[["Đã nhận (trừ hoàn)", received], ["Hóa đơn chưa thu / dư thu", order.totalAmount - received], ["Đã chuyển khách", totals?.customerTransferred || 0], ["Đã trả phí hóa đơn", totals?.feesPaid || 0]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><span className="text-gray-500">{label}</span><strong data-cy={label === "Đã nhận (trừ hoàn)" ? "dmsg-received" : undefined}>{formatCurrency(Number(value))}</strong></div>)}
    </div>
    <p className="text-xs text-gray-500 mt-3">Thu theo tổng hóa đơn. Doanh thu ĐMSG là chỉ số riêng; thu tiền không ghi doanh thu lần hai.</p>
    {order.status === "cancelled" && <p className="text-sm text-amber-700 mt-3">Đơn đã hủy. Các khoản tiền đã phát sinh vẫn giữ để đối soát.</p>}
    {(order.status === "completed" || (order.status === "cancelled" && received > 0)) && <div className="space-y-3 border-t mt-4 pt-4">
      <label className="block text-sm">Loại giao dịch<select value={kind} onChange={(e) => setKind(e.target.value as DmsgSettlementKind)} data-cy="dmsg-settlement-kind" className="mt-1 w-full h-12 border rounded-xl px-3 bg-white">{Object.entries(labels).filter(([key]) => order.status !== "cancelled" ? key !== "receipt" || order.totalAmount > received : key === "refund").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block text-sm">Số tiền (đ)<input type="text" inputMode="numeric" value={amount ? Number(amount).toLocaleString("vi-VN") : ""} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} data-cy="dmsg-settlement-amount" className="mt-1 w-full h-12 border rounded-xl px-3 bg-white text-gray-900" /></label>
      <label className="block text-sm">Phương thức<select value={method} onChange={(e) => setMethod(e.target.value)} data-cy="dmsg-settlement-method" className="mt-1 w-full h-12 border rounded-xl px-3 bg-white"><option value="bank_transfer">Chuyển khoản</option><option value="cash">Tiền mặt</option></select></label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <IonButton expand="block" fill="outline" disabled={isLoading} data-cy="dmsg-settlement-save" onClick={() => alert({ header: "Xác nhận tiền thực tế", message: `${labels[kind]}: ${formatCurrency(Number(amount))}. Chỉ xác nhận khi giao dịch đã xảy ra.`, buttons: [{ text: "Quay lại", role: "cancel" }, { text: "Xác nhận", handler: () => { void save(); } }] })}>Ghi nhận giao dịch</IonButton>
    </div>}
    <details className="mt-4"><summary className="text-sm font-medium cursor-pointer py-2">Lịch sử thao tác và giao dịch ({order.dmsgEvents?.length || 0})</summary>
      <ul className="space-y-3 text-xs mt-2">{order.dmsgEvents?.slice().reverse().map((event) => <li key={event.id} className="border-t pt-2"><p className="font-medium">{event.kind === "edit" ? "Cập nhật đơn và tài chính" : `${labels[event.kind]} · ${formatCurrency(event.amount)}`}</p><p className="text-gray-500 mt-1">{new Date(event.processedAt).toLocaleString("vi-VN")}{event.paymentMethod ? ` · ${event.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}` : ""}</p></li>)}</ul>
    </details>
  </AppCard>;
}
