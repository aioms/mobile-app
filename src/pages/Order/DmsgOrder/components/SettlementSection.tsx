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
    <h2 className="text-base font-bold text-gray-900 mb-2">Tiền thực thu / chi</h2>
    <div className="space-y-2 text-sm">
      {[["Đã nhận (trừ hoàn)", received], ["Hóa đơn chưa thu / dư thu", order.totalAmount - received], ["Đã chuyển khách", totals?.customerTransferred || 0], ["Đã trả phí hóa đơn", totals?.feesPaid || 0]].map(([label, value]) => <div key={label} className="flex justify-between items-center gap-2 py-0.5"><span className="text-gray-500 text-xs">{label}</span><strong className="text-gray-900 text-sm font-semibold tabular-nums" data-cy={label === "Đã nhận (trừ hoàn)" ? "dmsg-received" : undefined}>{formatCurrency(Number(value))}</strong></div>)}
    </div>
    <p className="text-xs text-gray-500 mt-2.5 pt-2 border-t border-gray-100">Thu theo tổng hóa đơn. Doanh thu ĐMSG là chỉ số riêng; thu tiền không ghi doanh thu lần hai.</p>
    {order.status === "cancelled" && (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3 text-xs text-amber-800 leading-relaxed">
        <strong>Lưu ý:</strong> Đơn đã hủy. Các khoản tiền đã phát sinh vẫn giữ để đối soát.
      </div>
    )}
    {(order.status === "completed" || (order.status === "cancelled" && received > 0)) && <div className="space-y-3 border-t border-gray-100 mt-4 pt-4">
      <label className="block text-xs font-semibold text-gray-700">Loại giao dịch<select value={kind} onChange={(e) => setKind(e.target.value as DmsgSettlementKind)} data-cy="dmsg-settlement-kind" className="mt-1 w-full h-11 border border-gray-200 rounded-xl px-3 bg-gray-50 focus:bg-white focus:border-blue-500 text-sm outline-none transition-colors">{Object.entries(labels).filter(([key]) => order.status !== "cancelled" ? key !== "receipt" || order.totalAmount > received : key === "refund").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="block text-xs font-semibold text-gray-700">Số tiền (đ)<input type="text" inputMode="numeric" value={amount ? Number(amount).toLocaleString("vi-VN") : ""} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} data-cy="dmsg-settlement-amount" className="mt-1 w-full h-11 border border-gray-200 rounded-xl px-3 bg-gray-50 focus:bg-white focus:border-blue-500 text-sm font-semibold text-gray-900 outline-none transition-colors" placeholder="0" /></label>
      <label className="block text-xs font-semibold text-gray-700">Phương thức<select value={method} onChange={(e) => setMethod(e.target.value)} data-cy="dmsg-settlement-method" className="mt-1 w-full h-11 border border-gray-200 rounded-xl px-3 bg-gray-50 focus:bg-white focus:border-blue-500 text-sm outline-none transition-colors"><option value="bank_transfer">Chuyển khoản</option><option value="cash">Tiền mặt</option></select></label>
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
      <IonButton expand="block" fill="outline" disabled={isLoading} data-cy="dmsg-settlement-save" onClick={() => alert({ header: "Xác nhận tiền thực tế", message: `${labels[kind]}: ${formatCurrency(Number(amount))}. Chỉ xác nhận khi giao dịch đã xảy ra.`, buttons: [{ text: "Quay lại", role: "cancel" }, { text: "Xác nhận", handler: () => { void save(); } }] })}>Ghi nhận giao dịch</IonButton>
    </div>}
    <details className="mt-4 group border-t border-gray-100 pt-3"><summary className="text-sm font-semibold text-gray-800 cursor-pointer py-1.5 flex items-center justify-between list-none"><span>Lịch sử thao tác và giao dịch ({order.dmsgEvents?.length || 0})</span><span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span></summary>
      <ul className="space-y-2.5 text-xs mt-2.5">{order.dmsgEvents?.slice().reverse().map((event) => <li key={event.id} className="border border-gray-100 bg-gray-50 rounded-xl p-2.5"><p className="font-semibold text-gray-900">{event.kind === "edit" ? "Cập nhật đơn và tài chính" : `${labels[event.kind]} · ${formatCurrency(event.amount)}`}</p><p className="text-gray-500 mt-1">{new Date(event.processedAt).toLocaleString("vi-VN")}{event.paymentMethod ? ` · ${event.paymentMethod === "cash" ? "Tiền mặt" : "Chuyển khoản"}` : ""}</p></li>)}</ul>
    </details>
  </AppCard>;
}
