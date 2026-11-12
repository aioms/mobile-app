import Attachments from "./components/Attachments";
import { useState, useMemo, useEffect } from "react";
import { IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonPage, IonSpinner, IonTitle, IonToolbar, useIonAlert, useIonModal, useIonViewDidEnter, useIonViewWillLeave } from "@ionic/react";
import { useParams, useHistory } from "react-router";
import { AppBadge, AppCard } from "@/components/UI";
import { Refresher } from "@/components/Refresher/Refresher";
import { useBarcodeScanner, useAuth } from "@/hooks";
import { UserRole } from "@/common/enums/user";
import useProduct from "@/hooks/apis/useProduct";
import { formatCurrency } from "@/helpers/formatters";
import { getOrderStatusColor, getOrderStatusLabel } from "@/common/constants/order";
import ModalSelectProduct from "../components/ModalSelectProduct";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import FinancialFields from "./components/FinancialFields";
import FinancialSummary from "./components/FinancialSummary";
import InventoryItems from "./components/InventoryItems";
import SettlementSection from "./components/SettlementSection";
import useDmsgEditor from "./hooks/useDmsgEditor";
import PaymentModal from "@/components/PaymentModal";
import { PaymentMethod } from "@/common/enums/payment";
import type { PaymentTransactionDto } from "@/types/payment.type";

export default function DmsgOrder() {
  const { id } = useParams<{ id?: string }>();
  const history = useHistory();
  const { user } = useAuth();
  const canManageDmsg = useMemo(() => {
    if (!user?.role) return false;
    return [UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER].includes(user.role);
  }, [user?.role]);

  useEffect(() => {
    if (user && !canManageDmsg) {
      history.replace("/tabs/orders");
    }
  }, [user, canManageDmsg, history]);

  const editor = useDmsgEditor(id);
  const [viewReady, setViewReady] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [completionAttempted, setCompletionAttempted] = useState(false);
  useIonViewDidEnter(() => setViewReady(true));
  useIonViewWillLeave(() => setViewReady(false));
  const [alert] = useIonAlert();
  const products = useProduct();
  const [presentProducts, dismissProducts] = useIonModal(ModalSelectProduct, { dismiss: (data?: unknown, role?: string) => dismissProducts(data, role) });
  const [presentCustomers, dismissCustomers] = useIonModal(ModalSelectCustomer, { dismiss: (data?: unknown, role?: string) => dismissCustomers(data, role), initialSelectedValue: editor.customer || "", allowRetailCustomer: true });
  const chooseProducts = () => presentProducts({ onDidDismiss: (event) => { if (event.detail.role === "confirm") editor.addProducts(event.detail.data); } });
  const scanner = useBarcodeScanner({ onBarcodeScanned: async (code) => {
    scanner.stopScan();
    try { const product = await products.getDetail(code); editor.addProducts([product]); }
    catch (cause) { editor.setError((cause as Error).message || "Không tìm thấy sản phẩm"); }
  } });
  const [uploading, setUploading] = useState(false);
  const confirm = (status: "draft" | "completed" | "cancelled") => {
    if (uploading) return;
    if (status !== "cancelled" && editor.items.some((item) => !Number.isSafeInteger(item.quantity) || item.quantity < 1)) { editor.setError("Số lượng phải là số nguyên lớn hơn 0"); return; }
    void alert({
      header: status === "cancelled" ? "Hủy đơn ĐMSG?" : status === "draft" ? "Lưu nháp đơn ĐMSG?" : editor.completed ? "Lưu chỉnh sửa đơn ĐMSG?" : "Hoàn thành và thanh toán đơn ĐMSG?",
      message: status === "cancelled" ? "Hàng sẽ hoàn về kho và đảo doanh thu/lợi nhuận. Các giao dịch tiền đã phát sinh vẫn giữ để đối soát."
        : status === "draft" ? "Nếu có sản phẩm, hệ thống xuất kho ngay theo số lượng. Nháp chưa cộng vào doanh thu và lợi nhuận chính thức."
        : editor.completed ? "Lưu chỉnh sửa thông tin, ghi chú và chứng từ. Không ghi thêm giao dịch thanh toán. Nếu đổi tổng hóa đơn, công nợ sẽ được tính lại."
        : "Xác nhận để chọn phương thức thanh toán toàn bộ tổng hóa đơn. Hàng đã xuất ở nháp sẽ không bị trừ thêm.",
      buttons: [{ text: "Quay lại", role: "cancel" }, { text: status === "completed" && !editor.completed ? "Tiếp tục thanh toán" : "Xác nhận", role: "confirm", handler: () => { if (status === "completed" && !editor.completed) { setCompletionAttempted(true); void editor.form.trigger(["totalCost", "invoiceTotal", "vatRate", "commissionRate"]).then((valid) => { if (valid) setPaymentOpen(true); }); } else void editor.persist(status); } }],
    });
  };

  if (user && !canManageDmsg) return null;

  return <IonPage data-dmsg-ready={viewReady && editor.loaded && !editor.isLoading ? "true" : "false"}>
    <IonHeader className="ion-no-border border-b border-gray-100"><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/tabs/orders" /></IonButtons><IonTitle>{id ? editor.order?.code || "Đơn gộp ĐMSG" : "Tạo đơn gộp ĐMSG"}</IonTitle></IonToolbar></IonHeader>
    <IonContent className="bg-gray-50">
      {id && <Refresher onRefresh={async (event) => { await editor.load(); event.detail.complete(); }} />}
      {!editor.loaded ? <div className="p-6 text-center">{editor.isLoading ? <IonSpinner /> : <><p role="alert" className="text-red-600 mb-3">{editor.error || "Không tìm thấy đơn"}</p><IonButton onClick={() => { void editor.load(); }}>Thử lại</IonButton></>}</div> : <div className="px-4 pt-4 pb-8 max-w-2xl mx-auto">
        <AppCard><div className="flex justify-between items-center gap-2"><h1 className="text-lg font-bold">Đơn gộp ĐMSG</h1><AppBadge color={editor.order ? getOrderStatusColor(editor.order.status) : "primary"} variant="soft" className="font-semibold text-xs px-3 py-1">{editor.order ? getOrderStatusLabel(editor.order.status) : "Đơn mới"}</AppBadge></div>
          <p className="text-sm text-gray-500 mt-2">Sản phẩm xuất kho tùy chọn · Tài chính theo tổng đơn</p></AppCard>
        <AppCard><h2 className="font-bold mb-2">Khách hàng</h2><IonButton fill="outline" expand="block" disabled={Boolean(id) || editor.isLoading} data-cy="dmsg-select-customer" onClick={() => presentCustomers({ onDidDismiss: (event) => { if (event.detail.role === "confirm") { const [customerId, name] = String(event.detail.data || "").split("__"); editor.setCustomer(customerId && customerId !== "individual" ? customerId : null); editor.setCustomerName(name || "Khách lẻ"); } } })}>{editor.order?.customer?.name || (editor.customer ? editor.customerName : "Chọn khách hàng / Khách lẻ")}</IonButton></AppCard>
        <InventoryItems items={editor.items} disabled={Boolean(editor.cancelled || editor.completed || editor.isLoading)} onChange={editor.setItems} onSearch={chooseProducts} onScan={() => { void scanner.startScan(); }} />
        <FinancialFields control={editor.form.control} errors={editor.form.formState.errors} disabled={Boolean(editor.cancelled || editor.isLoading)} requireCompletionFields={editor.completed || completionAttempted} />
        <Attachments savedValue={editor.order?.attachments || []} value={editor.attachments} onChange={editor.setAttachments} orderId={id} orderCode={editor.order?.code} disabled={Boolean(editor.cancelled || editor.isLoading)} onBusy={setUploading} />
        <FinancialSummary stateLabel={editor.cancelled ? "Đã hủy" : editor.form.formState.isDirty ? "Chưa lưu" : undefined} value={editor.financials} draft={!editor.completed && !editor.cancelled} />
        {editor.cancelled && <p className="text-sm text-red-600 mb-3">Đơn đã hủy: số liệu được giữ làm lịch sử, không cộng báo cáo.</p>}
        <AppCard><label className="block font-medium mb-2" htmlFor="dmsg-note">Ghi chú</label><textarea id="dmsg-note" {...editor.form.register("note")} disabled={Boolean(editor.cancelled || editor.isLoading)} className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900" rows={3} /></AppCard>
        {editor.order && <SettlementSection key={`${editor.order.id}-${editor.order.status}`} order={editor.order} reload={editor.load} />}
        {editor.error && <div role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl mb-3" data-cy="dmsg-error">{editor.error}{id && <IonButton fill="clear" onClick={() => { void editor.load(); }}>Tải lại đơn</IonButton>}</div>}
        {id && !editor.cancelled && <IonButton color="danger" fill="clear" expand="block" disabled={editor.isLoading || uploading} onClick={() => confirm("cancelled")} data-cy="dmsg-cancel">Hủy đơn và hoàn kho</IonButton>}
      </div>}
    </IonContent>
    {editor.loaded && !editor.cancelled && <IonFooter className="ion-no-border bg-white border-t border-gray-100">
      <div className="px-4 pt-3 max-w-2xl mx-auto"><div className="flex justify-between gap-3 text-sm"><span className="text-gray-500">{editor.completed ? "Doanh thu sau chỉnh sửa" : "Doanh thu dự kiến"}</span><strong className="text-blue-600">{editor.financials ? formatCurrency(editor.financials.revenue) : "—"}</strong></div>
        <div className="flex gap-2 py-2">{!editor.completed && <IonButton fill="outline" className="flex-1 min-h-11" disabled={editor.isLoading || uploading} onClick={() => confirm("draft")} data-cy="dmsg-save-draft">{editor.isLoading ? <IonSpinner name="crescent" /> : "Lưu nháp"}</IonButton>}
          <IonButton className="flex-1 min-h-11" disabled={editor.isLoading || uploading} onClick={() => confirm("completed")} data-cy="dmsg-complete">{editor.isLoading ? <IonSpinner name="crescent" /> : editor.completed ? "Lưu chỉnh sửa" : "Hoàn thành"}</IonButton></div>
      </div>
      {paymentOpen && editor.financials && <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} orderData={{ totalAmount: editor.financials.invoiceTotal }} onPaymentComplete={async (transactions: PaymentTransactionDto[]) => {
        await editor.persist("completed", transactions.map((transaction) => ({ amount: transaction.amount, paymentMethod: transaction.paymentMethod === PaymentMethod.CASH ? "cash" : "bank_transfer" })));
        setPaymentOpen(false);
      }} />}
    </IonFooter>}
  </IonPage>;
}
