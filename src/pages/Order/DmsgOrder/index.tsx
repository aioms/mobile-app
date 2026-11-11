import Attachments from "./components/Attachments";
import { useState, useMemo, useEffect } from "react";
import { IonBackButton, IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonPage, IonSpinner, IonTitle, IonToolbar, useIonAlert, useIonModal, useIonViewDidEnter, useIonViewWillLeave } from "@ionic/react";
import { alertCircleOutline, copyOutline, personOutline } from "ionicons/icons";
import { useParams, useHistory } from "react-router";
import { Toast } from "@capacitor/toast";
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
      header: status === "cancelled" ? "Hủy đơn ĐMSG?" : status === "draft" ? "Lưu nháp đơn ĐMSG?" : "Hoàn thành và thanh toán đơn ĐMSG?",
      message: status === "cancelled" ? "Hàng sẽ hoàn về kho và đảo doanh thu/lợi nhuận. Các giao dịch tiền đã phát sinh vẫn giữ để đối soát."
        : status === "draft" ? "Nếu có sản phẩm, hệ thống xuất kho ngay theo số lượng. Nháp chưa cộng vào doanh thu và lợi nhuận chính thức."
        : "Xác nhận để chọn phương thức thanh toán toàn bộ tổng hóa đơn. Hàng đã xuất ở nháp sẽ không bị trừ thêm.",
      buttons: [{ text: "Quay lại", role: "cancel" }, { text: status === "completed" && !editor.completed ? "Tiếp tục thanh toán" : "Xác nhận", role: "confirm", handler: () => { if (status === "completed" && !editor.completed) { setCompletionAttempted(true); void editor.form.trigger(["totalCost", "invoiceTotal", "vatRate", "commissionRate"]).then((valid) => { if (valid) setPaymentOpen(true); }); } else void editor.persist(status); } }],
    });
  };

  if (user && !canManageDmsg) return null;

  return <IonPage data-dmsg-ready={viewReady && editor.loaded && !editor.isLoading ? "true" : "false"}>
    <IonHeader className="ion-no-border border-b border-gray-100"><IonToolbar><IonButtons slot="start"><IonBackButton defaultHref="/tabs/orders" text="Trở lại" /></IonButtons><IonTitle>{id ? "Chi tiết đơn ĐMSG" : "Tạo đơn gộp ĐMSG"}</IonTitle></IonToolbar></IonHeader>
    <IonContent className="bg-gray-50">
      {id && <Refresher onRefresh={async (event) => { await editor.load(); event.detail.complete(); }} />}
      {!editor.loaded ? <div className="p-6 text-center">{editor.isLoading ? <IonSpinner /> : <><p role="alert" className="text-red-600 mb-3">{editor.error || "Không tìm thấy đơn"}</p><IonButton onClick={() => { void editor.load(); }}>Thử lại</IonButton></>}</div> : <div className="px-4 pt-4 pb-24 max-w-2xl mx-auto">
        <AppCard>
          <div className="flex justify-between items-center pb-3 border-b border-gray-100 gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-xs text-gray-500 font-medium block">{id ? "Mã đơn hàng" : "Loại đơn"}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <h1 className="text-base font-bold text-gray-900 break-all leading-snug">{editor.order?.code || "Đơn gộp ĐMSG"}</h1>
                {id && editor.order?.code && (
                  <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(editor.order!.code); await Toast.show({ text: "Đã sao chép mã đơn", duration: "short" }); } catch {} }} className="p-1 text-gray-400 hover:text-blue-600 rounded-md transition-colors" title="Sao chép mã đơn" aria-label="Sao chép mã đơn">
                    <IonIcon icon={copyOutline} className="text-base" />
                  </button>
                )}
              </div>
            </div>
            <AppBadge color={editor.order ? getOrderStatusColor(editor.order.status) : "primary"} variant="soft" className="font-semibold text-xs px-3 py-1 flex-shrink-0">
              {editor.order ? getOrderStatusLabel(editor.order.status) : "Đơn mới"}
            </AppBadge>
          </div>
          <div className="pt-2.5 flex items-center justify-between text-xs text-gray-500">
            <span>Sản phẩm xuất kho tùy chọn · Tài chính theo tổng đơn</span>
            {editor.order?.createdAt && (
              <span className="text-gray-400 whitespace-nowrap ml-2">
                {new Date(editor.order.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </AppCard>
        {editor.cancelled && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-3 flex items-start gap-2.5">
            <IonIcon icon={alertCircleOutline} className="text-red-600 text-lg flex-shrink-0 mt-0.5" />
            <div className="text-xs text-red-700 leading-relaxed">
              <strong className="font-semibold block text-sm mb-0.5">Đơn đã hủy</strong>
              Số liệu được giữ làm lịch sử đối soát và không cộng vào báo cáo doanh thu. Hàng hóa đã hoàn về tồn kho.
            </div>
          </div>
        )}
        <AppCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-gray-900">Khách hàng</h2>
            <AppBadge color="light" variant="soft" className="text-xs px-2 py-0.5">
              {editor.order?.customer ? "Khách hàng" : "Khách lẻ"}
            </AppBadge>
          </div>
          {!id ? (
            <IonButton fill="outline" expand="block" disabled={editor.isLoading} data-cy="dmsg-select-customer" onClick={() => presentCustomers({ onDidDismiss: (event) => { if (event.detail.role === "confirm") { const [customerId, name] = String(event.detail.data || "").split("__"); editor.setCustomer(customerId && customerId !== "individual" ? customerId : null); editor.setCustomerName(name || "Khách lẻ"); } } })}>
              <IonIcon icon={personOutline} slot="start" />
              {editor.customer ? editor.customerName : "Chọn khách hàng / Khách lẻ"}
            </IonButton>
          ) : (
            <div data-cy="dmsg-select-customer" className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                <IonIcon icon={personOutline} className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{editor.order?.customer?.name || editor.customerName || "Khách lẻ"}</p>
                <p className="text-xs text-gray-500">{editor.order?.customer ? (editor.order.customer.address || "Khách hàng") : "Khách lẻ"}</p>
              </div>
            </div>
          )}
        </AppCard>
        <InventoryItems items={editor.items} disabled={Boolean(editor.cancelled || editor.completed || editor.isLoading)} onChange={editor.setItems} onSearch={chooseProducts} onScan={() => { void scanner.startScan(); }} />
        <FinancialFields control={editor.form.control} errors={editor.form.formState.errors} disabled={Boolean(editor.cancelled || editor.isLoading)} requireCompletionFields={editor.completed || completionAttempted} />
        <FinancialSummary stateLabel={editor.cancelled ? "Đã hủy" : editor.form.formState.isDirty ? "Chưa lưu" : undefined} value={editor.financials} draft={!editor.completed && !editor.cancelled} />
        {editor.order && <SettlementSection key={`${editor.order.id}-${editor.order.status}`} order={editor.order} reload={editor.load} />}
        <Attachments value={editor.attachments} onChange={editor.setAttachments} orderId={id} disabled={Boolean(editor.cancelled || editor.isLoading)} onBusy={setUploading} />
        <AppCard><label className="block font-medium mb-2" htmlFor="dmsg-note">Ghi chú</label><textarea id="dmsg-note" {...editor.form.register("note")} disabled={Boolean(editor.cancelled || editor.isLoading)} className="w-full border border-gray-200 rounded-xl p-3 text-sm bg-white text-gray-900 focus:outline-none focus:border-blue-500" rows={3} placeholder="Ghi chú thêm về đơn hàng..." /></AppCard>
        {editor.error && <div role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl mb-3" data-cy="dmsg-error">{editor.error}{id && <IonButton fill="clear" onClick={() => { void editor.load(); }}>Tải lại đơn</IonButton>}</div>}
        {id && !editor.cancelled && <IonButton color="danger" fill="clear" expand="block" disabled={editor.isLoading || uploading} onClick={() => confirm("cancelled")} data-cy="dmsg-cancel">Hủy đơn và hoàn kho</IonButton>}
      </div>}
    </IonContent>
    {editor.loaded && !editor.cancelled && <IonFooter className="ion-no-border bg-white border-t border-gray-100">
      <div className="px-4 pt-3 max-w-2xl mx-auto"><div className="flex justify-between gap-3 text-sm"><span className="text-gray-500">{editor.completed ? "Doanh thu sau chỉnh sửa" : "Doanh thu dự kiến"}</span><strong className="text-blue-600">{editor.financials ? formatCurrency(editor.financials.revenue) : "—"}</strong></div>
        <div className="flex gap-2 py-2">{!editor.completed && <IonButton fill="outline" className="flex-1 min-h-11" disabled={editor.isLoading || uploading} onClick={() => confirm("draft")} data-cy="dmsg-save-draft">{editor.isLoading ? <IonSpinner name="crescent" /> : "Lưu nháp"}</IonButton>}
          <IonButton className="flex-1 min-h-11" disabled={editor.isLoading || uploading} onClick={() => confirm("completed")} data-cy="dmsg-complete">{editor.isLoading ? <IonSpinner name="crescent" /> : editor.completed ? "Lưu tài chính" : "Hoàn thành"}</IonButton></div>
      </div>
      {paymentOpen && editor.financials && <PaymentModal isOpen={paymentOpen} onClose={() => setPaymentOpen(false)} orderData={{ totalAmount: editor.financials.invoiceTotal }} onPaymentComplete={async (transactions: PaymentTransactionDto[]) => {
        await editor.persist("completed", transactions.map((transaction) => ({ amount: transaction.amount, paymentMethod: transaction.paymentMethod === PaymentMethod.CASH ? "cash" : "bank_transfer" })));
        setPaymentOpen(false);
      }} />}
    </IonFooter>}
  </IonPage>;
}
