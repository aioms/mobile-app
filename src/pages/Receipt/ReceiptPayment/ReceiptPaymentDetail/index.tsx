import React, { useState } from "react";
import { 
  IonPage, 
  IonHeader, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonTitle, 
  IonContent,
  IonFooter,
  IonIcon,
  IonAlert,
  useIonToast,
  useIonViewWillEnter,
  RefresherEventDetail
} from "@ionic/react";
import { useHistory, useParams } from "react-router-dom";
import { Trash2, Pencil, User, CheckCircle, FileText, CalendarClock } from "lucide-react";

import { ReceiptPaymentStatus, ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { PaymentMethod } from "@/common/enums/payment";
import { EXPENSE_TYPE_LABELS, getPaymentReceiptStatusColor, getPaymentReceiptTypeIcon } from "../common/utils";
import { formatCurrency, dayjsFormat } from "@/helpers/formatters";
import useReceiptPayment from "@/hooks/apis/useReceiptPayment";
import { Refresher } from "@/components/Refresher/Refresher";
import clsx from "clsx";

const ReceiptPaymentDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { getDetail, remove, update } = useReceiptPayment();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableNotes, setEditableNotes] = useState("");

  const fetchDetail = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await getDetail(id);
      if (result) {
        setData(result);
        setEditableNotes(result.notes || "");
      } else {
        presentToast({
          message: "Không tìm thấy thông tin phiếu chi",
          color: "warning",
          duration: 2000,
          position: "top"
        });
        history.goBack();
      }
    } catch (err) {
      console.error("Error fetching receipt detail:", err);
      presentToast({
        message: "Lỗi tải thông tin chi tiết: " + (err as Error).message,
        color: "danger",
        duration: 2000,
        position: "top"
      });
      history.goBack();
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useIonViewWillEnter(() => {
    const shouldShowLoading = !data || data.id !== id;
    fetchDetail(shouldShowLoading);
  }, [id, data]);

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    fetchDetail(false).finally(() => {
      event.detail.complete();
    });
  };

  if (isLoading || !data) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border border-b border-gray-100">
          <IonToolbar className="bg-white">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/extended/payment-receipts" color="dark" />
            </IonButtons>
            <IonTitle className="text-center text-[17px] font-bold text-gray-900">Chi tiết Phiếu Chi</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500 mt-10">Đang tải chi tiết...</div>
        </IonContent>
      </IonPage>
    );
  }

  const statusColor = getPaymentReceiptStatusColor(data.status as ReceiptPaymentStatus);
  const typeIcon = getPaymentReceiptTypeIcon(data.expenseType as ReceiptPaymentExpenseType);

  const handleDelete = async () => {
    try {
      await remove(id);
      presentToast({
        message: "Đã xoá phiếu chi thành công",
        color: "success",
        duration: 2000,
        position: "top"
      });
      history.goBack();
    } catch (err) {
      presentToast({
        message: "Lỗi xoá phiếu chi: " + (err as Error).message,
        color: "danger",
        duration: 2000,
        position: "top"
      });
    }
  };

  const handleSave = async () => {
    try {
      await update(id, { notes: editableNotes });
      setData((prev: any) => ({ ...prev, notes: editableNotes }));
      setIsEditing(false);
      presentToast({
        message: "Cập nhật ghi chú thành công",
        color: "success",
        duration: 2000,
        position: "top"
      });
    } catch (err) {
      presentToast({
        message: "Lỗi cập nhật ghi chú: " + (err as Error).message,
        color: "danger",
        duration: 2000,
        position: "top"
      });
    }
  };

  const handleCancel = () => {
    setEditableNotes(data.notes || "");
    setIsEditing(false);
  };


  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended/payment-receipts" color="dark" />
          </IonButtons>
          <IonTitle className="text-center text-[17px] font-bold text-gray-900">Chi tiết Phiếu Chi</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={handleRefresh} />
        {/* Header Section */}
        <div className="bg-white px-4 pt-6 pb-5 mb-2 border-b border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{data.code}</h2>
              <span className="text-sm text-gray-500 font-medium">Ngày chi: {dayjsFormat(data.paymentDate, "DD/MM/YYYY")}</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-sm font-bold ${statusColor.bg} ${statusColor.text}`}>
              {statusColor.label}
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${typeIcon.bg} ${typeIcon.color} flex-shrink-0 mt-0.5`}>
                <IonIcon icon={typeIcon.icon} className="text-xl" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Loại chi phí</p>
                <p className="font-semibold text-gray-900 text-[15px]">
                  {data.expenseType === ReceiptPaymentExpenseType.OTHER && data.expenseTypeName
                    ? data.expenseTypeName
                    : EXPENSE_TYPE_LABELS[data.expenseType as ReceiptPaymentExpenseType]}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0 mt-0.5">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-0.5">Đối tượng chi</p>
                <p className="font-semibold text-gray-900 text-[15px] leading-snug">{data.paymentObject || data.supplierName || "---"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Info Card */}
        <div className="bg-white px-4 py-5 mb-2 border-y border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4 uppercase tracking-wide">Thông tin thanh toán</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <FileText size={18} />
                <span className="font-medium">Số tiền</span>
              </div>
              <span className="text-xl font-extrabold text-red-600">{formatCurrency(Number(data.amount))}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500">
                <CheckCircle size={18} />
                <span className="font-medium">Hình thức</span>
              </div>
              <span className="font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                {data.paymentMethod === PaymentMethod.CASH ? "Tiền mặt" : data.paymentMethod === PaymentMethod.BANK_TRANSFER ? "Chuyển khoản" : "Thẻ tín dụng"}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Receipt Imports */}
        {data.receiptImports && data.receiptImports.length > 0 && (
          <div className="bg-white px-4 py-5 mb-2 border-y border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-800 mb-3 uppercase tracking-wide">
              Phiếu nhập liên kết ({data.receiptImports.length})
            </h3>
            <div className="flex flex-col gap-3">
              {data.receiptImports.map((imp: any) => (
                <div key={imp.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{imp.receiptNumber}</span>
                    <span className="font-bold text-red-600 text-sm">{formatCurrency(Number(imp.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Kho: {imp.warehouse || "---"}</span>
                    <span>Ngày nhập: {imp.importDate ? dayjsFormat(imp.importDate, "DD/MM/YYYY") : "---"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Card */}
        <div className="bg-white px-4 py-5 mb-2 border-y border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800 mb-3 uppercase tracking-wide">Ghi chú</h3>
          <div className="w-full">
            <textarea
              disabled={!isEditing}
              value={isEditing ? editableNotes : data.notes || ""}
              onChange={(e) => setEditableNotes(e.target.value)}
              className={clsx(
                "w-full min-h-[100px] p-3.5 rounded-xl text-[15px] leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:ring-2",
                isEditing
                  ? "border border-blue-400 bg-white text-gray-800 focus:ring-blue-100 shadow-sm"
                  : data.notes
                    ? "border border-yellow-100 bg-yellow-50/50 text-gray-700 cursor-not-allowed"
                    : "border border-gray-100 bg-gray-50 text-gray-400 italic cursor-not-allowed"
              )}
              placeholder={isEditing ? "Nhập ghi chú..." : "Không có ghi chú"}
            />
          </div>
        </div>

        {/* Other Info Card */}
        <div className="bg-white px-4 py-5 mb-8 border-y border-gray-100">
          <h3 className="text-[15px] font-bold text-gray-800 mb-4 uppercase tracking-wide">Thông tin hệ thống</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium text-sm">Người tạo</span>
              <span className="font-semibold text-gray-900 text-sm">{data.user?.fullname || "---"}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium text-sm">Ngày tạo</span>
              <span className="text-gray-900 font-medium text-sm">{dayjsFormat(data.createdAt, "DD/MM/YYYY HH:mm")}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-gray-500 font-medium text-sm">Cập nhật lần cuối</span>
              <span className="text-gray-900 font-medium text-sm">{dayjsFormat(data.updatedAt, "DD/MM/YYYY HH:mm")}</span>
            </div>
          </div>
        </div>
      </IonContent>

      <IonFooter className="bg-white border-t border-gray-100 p-4">
        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-gray-200 text-gray-600 font-bold bg-white active:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold shadow-sm active:bg-blue-700 transition-colors"
            >
              Lưu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowDeleteAlert(true)}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border-2 border-red-100 text-red-600 font-bold bg-red-50/50 active:bg-red-100 transition-colors"
            >
              <Trash2 size={20} />
              Xoá phiếu
            </button>
            <button
              onClick={() => {
                if (data.status === ReceiptPaymentStatus.DRAFT) {
                  history.push(`/tabs/extended/payment-receipts/update/${data.id}`);
                } else {
                  setIsEditing(true);
                  setEditableNotes(data.notes || "");
                }
              }}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 text-white font-bold shadow-sm active:bg-blue-700 transition-colors"
            >
              <Pencil size={20} />
              Sửa phiếu
            </button>

          </div>
        )}
      </IonFooter>


      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => setShowDeleteAlert(false)}
        header="Xoá phiếu chi?"
        message="Bạn có chắc chắn muốn xoá phiếu chi này? Thao tác này không thể hoàn tác."
        buttons={[
          { text: "Hủy", role: "cancel", cssClass: "text-gray-500 font-medium" },
          { text: "Xoá", role: "destructive", handler: handleDelete, cssClass: "text-red-600 font-bold" }
        ]}
      />
    </IonPage>
  );
};

export default ReceiptPaymentDetailScreen;

