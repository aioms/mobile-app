import React from "react";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
} from "@ionic/react";
import {
  personOutline,
  businessOutline,
  cubeOutline,
  receiptOutline,
  callOutline,
  locationOutline,
  helpCircleOutline,
  documentTextOutline,
  cashOutline,
  repeatOutline,
} from "ionicons/icons";
import { IReceiptReturn, ReceiptReturnType } from "@/types/receipt-return.type";
import { getReturnCardBadgeConfig } from "@/common/constants/receipt-return.constant";
import { formatCurrency, dayjsFormat, formatProductCode } from "@/helpers/formatters";
import useReceiptReturn from "@/hooks/apis/useReceiptReturn";

interface ReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: IReceiptReturn | null;
}

const ReturnDetailModal: React.FC<ReturnDetailModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const [detailData, setDetailData] = React.useState<IReceiptReturn | null>(null);
  const { getDetail } = useReceiptReturn();

  const receiptId = receipt?.id;

  React.useEffect(() => {
    if (!isOpen || !receiptId) {
      setDetailData(null);
      return;
    }

    setDetailData(receipt);
    let isMounted = true;

    getDetail(receiptId)
      .then((res: any) => {
        if (isMounted && res?.receipt) {
          setDetailData({
            ...res.receipt,
            items: res.items || res.receipt.items || [],
          });
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch receipt detail:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [receiptId, isOpen, getDetail]);


  const activeReceipt = detailData || receipt;
  if (!activeReceipt) return null;

  const isCustomer = activeReceipt.type === ReceiptReturnType.CUSTOMER;
  const partner = isCustomer ? activeReceipt.customer : activeReceipt.supplier;
  const badgeConfig = getReturnCardBadgeConfig(
    activeReceipt.status,
    activeReceipt.operationType,
  );
  const formattedDateTime = dayjsFormat(
    activeReceipt.returnDate || activeReceipt.createdAt,
    "DD/MM/YYYY • HH:mm",
  );

  const displayCode = activeReceipt.receiptNumber.startsWith("#")
    ? activeReceipt.receiptNumber
    : `#${activeReceipt.receiptNumber}`;


  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.9}
      breakpoints={[0, 0.9, 1]}
    >
      <IonPage>
        <IonHeader className="ion-no-border border-b border-gray-100">
          <IonToolbar>
            <IonTitle className="text-base font-bold text-gray-900">
              Chi tiết phiếu trả hàng
            </IonTitle>
            <IonButtons slot="end">
              <IonButton
                data-cy="return-detail-close-btn"
                color="medium"
                onClick={onClose}
                className="text-sm font-medium"
              >
                Đóng
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent data-cy="return-detail-modal" className="ion-padding bg-gray-50">
          <div className="space-y-4 pb-8">
            {/* Header Card: Code, Status & Time */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs text-gray-500">Mã phiếu trả</span>
                  <h2
                    data-cy="return-detail-code"
                    className="text-lg font-bold text-blue-600 tracking-tight"
                  >
                    {displayCode}
                  </h2>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full border ${badgeConfig.bgClass} ${badgeConfig.textClass} ${badgeConfig.borderClass}`}
                >
                  {badgeConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-500">{formattedDateTime}</p>
            </div>

            {/* Partner Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <IonIcon
                    icon={isCustomer ? personOutline : businessOutline}
                    className="text-blue-600 text-sm"
                  />
                  <span>
                    {isCustomer ? "Thông tin khách hàng" : "Thông tin nhà cung cấp"}
                  </span>
                </span>
                {partner?.group && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {partner.group}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 w-24 flex-shrink-0">Họ và tên:</span>
                  <span
                    data-cy="return-detail-partner-name"
                    className="font-semibold text-gray-900"
                  >
                    {partner?.name || "Chưa xác định"}
                  </span>
                </div>
                {partner?.phone && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Số điện thoại:
                    </span>
                    <span className="text-gray-900 font-medium">
                      {partner.phone}
                    </span>
                  </div>
                )}
                {partner?.address && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 w-24 flex-shrink-0">
                      Địa chỉ:
                    </span>
                    <span className="text-gray-800">{partner.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Returned Items Card */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <IonIcon icon={cubeOutline} className="text-blue-600 text-sm" />
                  <span>Sản phẩm trả ({activeReceipt.totalProduct || activeReceipt.items?.length || 0})</span>
                </span>
                <span className="text-xs text-gray-500">
                  Tổng SL: {activeReceipt.totalQuantity}
                </span>
              </div>

              <div className="space-y-2.5">
                {activeReceipt.items && activeReceipt.items.length > 0 ? (
                  activeReceipt.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-gray-900">
                          {item.productName}
                        </span>
                        <span className="font-bold text-blue-600 flex-shrink-0">
                          {formatCurrency((item.unitPrice || item.costPrice || 0) * item.quantity)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-500 text-[11px]">
                        <span>Mã: {formatProductCode(item.code || item.productCode)}</span>
                        <span>
                          {item.quantity} x {formatCurrency(item.unitPrice || item.costPrice || 0)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Chưa có danh sách mặt hàng
                  </p>
                )}
              </div>
            </div>

            {/* Exchange Items Card (if applicable) */}
            {activeReceipt.operationType === "exchange" &&
              activeReceipt.exchangeItems &&
              activeReceipt.exchangeItems.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                      <IonIcon icon={repeatOutline} className="text-blue-600 text-sm" />
                      <span>Hàng nhận đổi</span>
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeReceipt.exchangeItems.map((exItem, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-50/50 rounded-xl p-3 border border-blue-100 space-y-1 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-gray-900">
                            {exItem.productName}
                          </span>
                          <span className="font-bold text-blue-600 flex-shrink-0">
                            {formatCurrency(exItem.unitPrice * exItem.quantity)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 text-[11px]">
                          <span>Mã: {formatProductCode((exItem as any).code || exItem.productCode)}</span>
                          <span>
                            {exItem.quantity} x {formatCurrency(exItem.unitPrice)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Reason & Note */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2 text-xs">
              {activeReceipt.reason && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-0.5">
                    Lý do trả:
                  </span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {activeReceipt.reason}
                  </p>
                </div>
              )}
              {activeReceipt.note && (
                <div>
                  <span className="font-semibold text-gray-700 block mb-0.5">
                    Ghi chú:
                  </span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {activeReceipt.note}
                  </p>
                </div>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block pb-2 border-b border-gray-100">
                Tổng kết thanh toán
              </span>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Nghiệp vụ:</span>
                <span className="font-semibold text-gray-900">
                  {activeReceipt.operationType === "exchange"
                    ? "Đổi hàng"
                    : "Trả hàng (Hoàn tiền)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Phương thức hoàn:</span>
                <span className="font-semibold text-gray-900">
                  {activeReceipt.paymentMethod === 1 ? "Tiền mặt" : "Chuyển khoản"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-sm font-bold text-gray-900">
                  {activeReceipt.operationType === "exchange"
                    ? "Tổng giá trị đổi:"
                    : "Tổng tiền hoàn trả:"}
                </span>
                <span
                  data-cy="return-detail-total-amount"
                  className="text-lg font-extrabold text-blue-600"
                >
                  {formatCurrency(
                    activeReceipt.operationType === "exchange" && activeReceipt.differenceAmount
                      ? activeReceipt.differenceAmount
                      : activeReceipt.totalAmount,
                  )}
                </span>
              </div>
            </div>

          </div>
        </IonContent>
      </IonPage>
    </IonModal>
  );
};

export default ReturnDetailModal;
