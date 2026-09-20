import React, { useState, useEffect, useCallback } from "react";
import { useHistory, useParams } from "react-router";
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  useIonToast,
  useIonActionSheet,
} from "@ionic/react";
import { chevronBack, ellipsisVertical, removeCircleOutline, calendarOutline } from "ionicons/icons";
import { AppBadge, AppCard } from "@/components/UI";
import ExportReceiptBillModal from "../components/ExportReceiptBill/ExportReceiptBillModal";
import { useAuth } from "@/hooks";
import CancelConfirmationModal from "./components/CancelConfirmationModal";
import {
  dayjsFormat,
  formatCurrency,
  formatCurrencyWithoutSymbol,
} from "@/helpers/formatters";
import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { useLoading } from "@/hooks";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_DEBT_STATUS,
  RECEIPT_DEBT_TYPE,
  TReceiptDebtStatus,
  TReceiptDebtType,
} from "@/common/constants/receipt-debt.constant";
import { IProductItem } from "@/types/product.type";
import { getDate } from "@/helpers/date";
import {
  getPaymentMethodLabel,
  getTransactionStatusLabel,
  getTransactionStatusColor,
} from "@/helpers/paymentHelpers";
import PaymentModal, { PaymentMethod } from "./components/PaymentModal";
import { PayDebtRequestDto, PaymentTransactionDto } from "@/types/payment.type";
import { Transaction } from "@/types/transaction.type";
import { PaymentMethod as PaymentMethodEnum } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import EmptyPage from "@/components/EmptyPage";
import { Refresher } from "@/components/Refresher/Refresher";

// Updated interfaces to match API response
export interface ReceiptDebt {
  id: string;
  code: string;
  type: TReceiptDebtType;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isOrderRevenue: boolean;
  status: TReceiptDebtStatus;
  dueDate: Date;
  paymentDate: Date | null;
  note?: string | null;
  createdAt: Date;
  supplierName: string;
  customerName: string;
  customer?: {
    id: string;
    name: string;
  };
}

interface ReceiptPeriodSummary {
  id: string;
  vatAmount: number;
}

interface ResponseData {
  receipt: ReceiptDebt | null;
  items: Record<string, IProductItem[]>;
  periods?: Record<string, ReceiptPeriodSummary>;
}

const ReceiptDebtDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const { user } = useAuth();

  const [receiptData, setReceiptData] = useState<ResponseData>({
    receipt: null,
    items: {}, // Fix: Initialize as empty object instead of array
    periods: {},
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { isLoading, withLoading } = useLoading();
  const { getDetail, payDebt, getPaymentTransactions, cancelReceiptDebt } = useReceiptDebt();

  // Fetch payment transactions
  const fetchPaymentTransactions = useCallback(async () => {
    try {
      const response = await getPaymentTransactions(id);

      if (response.transactions) {
        setTransactions(response.transactions);
      }
    } catch (err) {
      console.error("Failed to fetch payment transactions:", err);
      captureException(err as Error, createExceptionContext(
        'ReceiptDebtDetail',
        'PaymentTransactions',
        'fetchPaymentTransactions'
      ));
      // Don't show error toast for transactions as it's not critical
    }
  }, [id]);

  // Fetch receipt data from API
  const fetchReceiptDetail = useCallback(async () => {
    await withLoading(async () => {
      try {
        const result = await getDetail(id);

        if (!result) {
          presentToast({
            message: "Không tìm thấy phiếu",
            duration: 1000,
            position: "top",
          });
          return;
        }

        setReceiptData(result);
        // Also fetch payment transactions
        await fetchPaymentTransactions();
      } catch (err) {
        captureException(err as Error, createExceptionContext(
          'ReceiptDebtDetail',
          'ReceiptDebtDetail',
          'fetchReceiptDetail'
        ));
        presentToast({
          message: (err as Error).message || "Đã có lỗi xảy ra",
          duration: 2000,
          position: "top",
        });
      }
    });
  }, [id]);

  useEffect(() => {
    id && fetchReceiptDetail();
  }, [id]);

  const handleRefresh = async (event: CustomEvent) => {
    await fetchReceiptDetail();
    event.detail.complete();
  };

  // Callback handler for payment completion
  const handlePaymentComplete = useCallback(
    async (amount: number, method: PaymentMethod, description: string) => {
      await withLoading(async () => {
        try {
          // Validate input
          if (!amount || amount <= 0) {
            throw new Error("Số tiền thanh toán không hợp lệ");
          }

          if (!receiptData.receipt) {
            throw new Error("Không tìm thấy thông tin phiếu thu");
          }

          if (amount > receiptData.receipt?.remainingAmount) {
            throw new Error(
              "Số tiền thanh toán không được vượt quá số tiền còn lại"
            );
          }

          // Map payment method from modal to API enum
          const mapPaymentMethod = (
            method: PaymentMethod
          ): PaymentMethodEnum => {
            switch (method) {
              case "cash":
                return PaymentMethodEnum.CASH;
              case "qr":
                return PaymentMethodEnum.BANK_TRANSFER; // QR is typically bank transfer
              default:
                return PaymentMethodEnum.CASH;
            }
          };

          // Prepare payment data
          const paymentTransaction: PaymentTransactionDto = {
            amount,
            paymentMethod: mapPaymentMethod(method),
            type: TransactionType.PAYMENT,
            note:
              description ||
              `Thanh toán cho phiếu thu ${receiptData.receipt.code}`,
          };

          const paymentData: PayDebtRequestDto = {
            transactions: [paymentTransaction],
            note: `Thanh toán ${formatCurrency(amount)} bằng ${method === "cash" ? "tiền mặt" : "chuyển khoản"
              }`,
          };

          // Call payment API
          const response = await payDebt(id, paymentData);

          if (response.success) {
            await presentToast({
              message: `Đã ghi nhận thanh toán ${formatCurrency(amount)} bằng ${method === "cash" ? "tiền mặt" : "chuyển khoản"
                }`,
              duration: 2000,
              position: "top",
            });

            // Refresh the receipt data to show updated payment status
            await fetchReceiptDetail();
          } else {
            throw new Error(response.message || "Thanh toán thất bại");
          }
        } catch (error) {
          captureException(error as Error, createExceptionContext(
            'ReceiptDebtDetail',
            'PaymentModal',
            'handlePaymentComplete'
          ));
          presentToast({
            message:
              error instanceof Error
                ? error.message
                : "Có lỗi xảy ra khi ghi nhận thanh toán",
            duration: 3000,
            position: "top",
          });
        }
      });
    },
    [id, receiptData.receipt]
  );

  // Handler for cancel confirmation
  const handleCancelConfirm = async (note: string) => {
    await withLoading(async () => {
      try {
        if (!receiptData.receipt) {
          throw new Error("Không tìm thấy thông tin phiếu thu");
        }

        await cancelReceiptDebt(id, note);

        await presentToast({
          message: "Đã hủy phiếu thu thành công",
          duration: 2000,
          position: "top",
        });

        // Refresh the receipt data to show updated status
        await fetchReceiptDetail();

        // Close the modal
        setIsCancelModalOpen(false);
      } catch (error) {
        captureException(error as Error, createExceptionContext(
          'ReceiptDebtDetail',
          'CancelConfirmationModal',
          'handleCancelConfirm'
        ));
        presentToast({
          message:
            error instanceof Error
              ? error.message
              : "Có lỗi xảy ra khi hủy phiếu thu",
          duration: 3000,
          position: "top",
        });
      }
    });
  };

  const handleActionSheet = () => {
    const flattenedProducts = Object.entries(items)
      .flatMap(([period, periodItems]) =>
        periodItems.map(item => {
          const returnedQty = item.returnedQuantity || 0;
          const returnableQty = item.quantity - returnedQty;
          return {
            id: item.id,
            productId: item.productId,
            code: item.code,
            productName: item.productName,
            quantity: returnableQty, // Use returnable quantity
            price: item.costPrice,
            returnedQuantity: returnedQty, // Pass along for display
            periodId: item.receiptPeriodId,
            periodDate: period,
          };
        })
      )
      .filter(item => item.quantity > 0); // Only include items with returnable quantity

    presentActionSheet({
      header: "Tùy chọn",
      buttons: [
        {
          text: "Thanh toán",
          role: "selected",
          handler: () => {
            setIsPaymentModalOpen(true);
          },
        },
        {
          text: "Chỉnh sửa",
          handler: () => {
            history.push(`/tabs/debt/update/${id}`);
          },
        },
        {
          text: "Trả hàng",
          handler: () => {
            history.push({
              pathname: `/tabs/receipt/return`,
              state: {
                refId: id,
                refType: 'debt',
                customerId: receipt?.customer?.id,
                customerName: receipt?.customer?.name || receipt?.customerName || "Khách lẻ",
                orderProducts: flattenedProducts,
              },
            });
          },
        },
        {
          text: "In phiếu",
          handler: () => {
            setIsExportModalOpen(true);
          },
        },
        ...(receipt?.status !== RECEIPT_DEBT_STATUS.CANCELLED ? [
          {
            text: "Hủy phiếu",
            handler: () => {
              setIsCancelModalOpen(true);
            },
          },
        ] : []),
        {
          text: "Hủy",
          role: "cancel",
        },
      ],
    });
  };

  if (!receiptData) {
    return <EmptyPage />
  }

  const { receipt, items, periods = {} } = receiptData;

  const totalVatAmount = Object.values(periods).reduce(
    (sum, period) => sum + (period?.vatAmount || 0),
    0
  );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => history.goBack()}
              className="text-gray-600"
            >
              <IonIcon icon={chevronBack} />
              Trở lại
            </IonButton>
          </IonButtons>
          <IonTitle className="text-lg font-semibold text-gray-800">
            Chi tiết phiếu thu
          </IonTitle>
          {receipt?.status !== RECEIPT_DEBT_STATUS.CANCELLED && (
            <IonButtons slot="end">
              <IonButton onClick={handleActionSheet}>
                <IonIcon icon={ellipsisVertical} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
        <Refresher onRefresh={handleRefresh} />

        <div className="p-4 space-y-4">
          {/* Main Info Card */}
          <AppCard className="!mb-0">
            {/* Header: Code & Status */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Mã phiếu</span>
                <span className="text-base font-bold text-gray-900">{receipt?.code}</span>
              </div>
              {receipt?.status && (
                <AppBadge
                  color={getStatusColor(receipt?.status as TReceiptDebtStatus)}
                  variant="soft"
                  className="font-semibold text-xs px-3 py-1"
                >
                  {getStatusLabel(receipt?.status as TReceiptDebtStatus)}
                </AppBadge>
              )}
            </div>

            {/* Target Partner Info */}
            <div className="py-3 border-b border-gray-100">
              <span className="text-xs text-gray-500 font-medium block">
                {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT
                  ? "Khách hàng"
                  : "Nhà cung cấp"}
              </span>
              <span className="text-base font-semibold text-gray-900 mt-0.5 block leading-snug">
                {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT
                  ? receipt?.customerName
                  : receipt?.supplierName}
              </span>
            </div>

            {/* Date Information Grid */}
            <div className="grid grid-cols-2 gap-3 py-3 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-500 font-medium block">Ngày tạo</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                  {dayjsFormat(receipt?.createdAt, "DD/MM/YYYY")}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium block">Hạn thu dự kiến</span>
                <span className="text-sm font-semibold text-gray-800 mt-0.5 block">
                  {dayjsFormat(receipt?.dueDate, "DD/MM/YYYY")}
                </span>
              </div>
            </div>

            {/* Note if available */}
            {receipt?.note && (
              <div className="pt-3">
                <span className="text-xs text-gray-500 font-medium block">Ghi chú</span>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  {receipt?.note}
                </p>
              </div>
            )}
          </AppCard>

          {/* Product List by Period */}
          <AppCard className="!mb-0 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white">
              <h3 className="text-base font-bold text-gray-900">
                Danh sách sản phẩm theo đợt
              </h3>
            </div>

            {/* Display items grouped by period, sorted with newest dates first */}
            {Object.entries(items)
              .sort(([periodA], [periodB]) => {
                return new Date(periodB).getTime() - new Date(periodA).getTime();
              })
              .map(([period, periodItems]) => (
                <div
                  key={period}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Period Header */}
                  <div className="bg-blue-50/90 px-4 py-2.5 border-y border-blue-100/80 flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5 text-blue-900">
                      <IonIcon icon={calendarOutline} className="text-base text-blue-600" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Đợt thu: {getDate(period).format("DD/MM/YYYY")}
                      </span>
                    </div>
                    {periods[period] && (
                      <span className="text-xs font-bold text-blue-700 bg-white/90 px-2.5 py-0.5 rounded-full shadow-xs border border-blue-200/60 whitespace-nowrap">
                        VAT: {formatCurrency(periods[period].vatAmount || 0)}
                      </span>
                    )}
                  </div>

                  {/* Period Items */}
                  <div className="divide-y divide-gray-100">
                    {periodItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-4 ${item.metadata?.shipNow ? 'bg-orange-50/40' : 'bg-white'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 leading-snug">
                              {item.productName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500 font-medium">
                                Mã: {item.code}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-gray-600 font-medium">
                                SL: <strong className="text-gray-900 font-bold">{item.quantity}</strong>
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {item.metadata?.shipNow && (
                                <AppBadge color="warning" variant="soft" className="text-[10px] px-2 py-0.5">
                                  Giao ngay
                                </AppBadge>
                              )}
                              {item.returnedQuantity && item.returnedQuantity > 0 ? (
                                <AppBadge color="warning" variant="outline" className="text-[10px] px-2 py-0.5">
                                  Đã trả: {item.returnedQuantity}
                                </AppBadge>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-bold text-gray-900">
                              {formatCurrencyWithoutSymbol(item.costPrice)}đ
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                Tổng: {formatCurrencyWithoutSymbol(item.costPrice * item.quantity)}đ
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* Show message if no items */}
            {Object.keys(items).length === 0 && (
              <div className="p-6 text-center text-gray-500 text-sm">
                Chưa có sản phẩm nào
              </div>
            )}
          </AppCard>

          {/* Payment Details */}
          <AppCard className="!mb-0 !p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-white">
              <h3 className="text-base font-bold text-gray-900">
                Lịch sử thu tiền
              </h3>
            </div>

            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-100 bg-white">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-600">
                            +{formatCurrency(transaction.amount)}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {dayjsFormat(transaction.processedAt, "DD/MM/YYYY HH:mm")}
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-gray-600 mt-1 italic break-words">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        <AppBadge
                          color={getTransactionStatusColor(transaction.status)}
                          variant="soft"
                          className="text-[11px] px-2.5 py-0.5 font-semibold whitespace-nowrap shrink-0"
                        >
                          {getTransactionStatusLabel(transaction.status)}
                        </AppBadge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                Chưa có lịch sử thanh toán
              </div>
            )}
          </AppCard>

          {/* Financial Summary */}
          <AppCard className="!mb-0 space-y-2.5">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-600">
                Tổng công nợ
              </span>
              <span className="text-xl font-black text-red-600">
                {receipt?.totalAmount != null &&
                  formatCurrency(receipt.totalAmount)}
              </span>
            </div>
            {totalVatAmount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Tổng thuế VAT</span>
                <span className="font-semibold text-gray-800">
                  {formatCurrency(totalVatAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Đã thu</span>
              <span className="font-bold text-emerald-600">
                {receipt?.paidAmount != null &&
                  formatCurrency(receipt.paidAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-base font-bold text-gray-800">Còn lại</span>
              <span className="text-xl font-black text-blue-600">
                {receipt?.remainingAmount != null &&
                  formatCurrency(receipt.remainingAmount)}
              </span>
            </div>
          </AppCard>

          {/* Cancel debt receipt section */}
          {receipt?.status === RECEIPT_DEBT_STATUS.CANCELLED ? (
            null
          ) : (
            <div>
              <IonButton
                expand="block"
                fill="outline"
                className="rounded-lg text-red-600"
                onClick={() => setIsCancelModalOpen(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  "Đang xử lý..."
                ) : (
                  <>
                    <IonIcon icon={removeCircleOutline} slot="start" />
                    Hủy phiếu
                  </>
                )}
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>

      {/* Add PaymentModal at the end before closing IonPage */}
      {receipt && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          receiptData={{
            code: receipt.code,
            remainingAmount: receipt.remainingAmount,
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Add CancelConfirmationModal */}
      {receipt && (
        <CancelConfirmationModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancelConfirm}
          isLoading={isLoading}
          receiptCode={receipt.code}
        />
      )}

      {/* Export receipt bill modal */}
      {receipt && (
        <ExportReceiptBillModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          receiptCode={receipt.code}
          customerName={receipt.customerName || receipt.supplierName || ""}
          storeCode={user?.storeCode || "KS"}
          paidAmount={receipt.paidAmount}
          remainingAmount={receipt.remainingAmount}
          items={items}
          periods={periods}
        />
      )}
    </IonPage>
  );
};

export default ReceiptDebtDetail;
