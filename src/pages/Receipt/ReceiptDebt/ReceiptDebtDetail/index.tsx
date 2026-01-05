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
import { chevronBack, ellipsisVertical, removeCircleOutline } from "ionicons/icons";
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

interface ResponseData {
  receipt: ReceiptDebt | null;
  items: Record<string, IProductItem[]>;
}

const ReceiptDebtDetail: React.FC = () => {
  const history = useHistory();
  const { id } = useParams<{ id: string }>();
  const [presentToast] = useIonToast();
  const [presentActionSheet] = useIonActionSheet();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const [receiptData, setReceiptData] = useState<ResponseData>({
    receipt: null,
    items: {}, // Fix: Initialize as empty object instead of array
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { isLoading, withLoading } = useLoading();
  const { getDetail, payDebt, getPaymentTransactions, cancelReceiptDebt } = useReceiptDebt();

  // Fetch payment transactions
  const fetchPaymentTransactions = useCallback(async () => {
    try {
      const response = await getPaymentTransactions(id);

      if (response.transactions && response.transactions.length > 0) {
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
    async (amount: number, method: PaymentMethod) => {
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
            note: `Thanh toán cho phiếu thu ${receiptData.receipt.code}`,
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
    // Flatten all products from all periods for return slip
    // Calculate returnable quantity = quantity - returnedQuantity
    const flattenedProducts = Object.values(items)
      .flat()
      .map(item => {
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
        };
      })
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
            presentToast({
              message: "Tính năng này đang được phát triển",
              duration: 2000,
              position: "top",
            });
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

  const { receipt, items } = receiptData;

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
          {/* Receipt Information */}
          <IonCard className="shadow-sm">
            <IonCardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Mã phiếu:</span>
                  <span className="text-gray-800 font-medium">
                    {receipt?.code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Ngày Tạo:</span>
                  <span className="text-gray-800 font-medium">
                    {dayjsFormat(receipt?.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    Ngày Thu Dự Kiến:
                  </span>
                  <span className="text-gray-800 font-medium">
                    {dayjsFormat(receipt?.dueDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT
                      ? "Khách Hàng:"
                      : "Nhà Cung Cấp:"}
                  </span>
                  <span className="text-gray-800 font-medium">
                    {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT
                      ? receipt?.customerName
                      : receipt?.supplierName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">Trạng Thái:</span>
                  {receipt?.status && (
                    <IonChip
                      color={getStatusColor(
                        receipt?.status as TReceiptDebtStatus
                      )}
                      className="text-xs px-3 py-1 rounded-full"
                    >
                      {getStatusLabel(receipt?.status as TReceiptDebtStatus)}
                    </IonChip>
                  )}
                </div>
                {receipt?.note && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Ghi Chú:</span>
                    <span className="text-gray-800 font-medium">
                      {receipt?.note}
                    </span>
                  </div>
                )}
              </div>
            </IonCardContent>
          </IonCard>

          {/* Product List by Period */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Danh Sách Sản Phẩm Theo Đợt Thu
              </h3>
            </div>

            {/* Display items grouped by period, sorted with newest dates first */}
            {Object.entries(items)
              .sort(([periodA], [periodB]) => {
                // Sort periods in descending order (newest first)
                return new Date(periodB).getTime() - new Date(periodA).getTime();
              })
              .map(([period, periodItems]) => (
                <div
                  key={period}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Period Header */}
                  <div className="bg-blue-50 px-4 py-2">
                    <h4 className="text-sm font-medium text-blue-700">
                      Đợt: {getDate(period).format("DD/MM/YYYY")}
                    </h4>
                  </div>

                  {/* Table Header */}
                  <div className="bg-green-50 px-4 py-3">
                    <IonGrid className="p-0">
                      <IonRow className="text-xs font-medium text-green-700">
                        <IonCol size="2" className="p-0">
                          Mã SP
                        </IonCol>
                        <IonCol size="4" className="p-0 text-center">
                          Tên SP
                        </IonCol>
                        <IonCol size="2" className="p-0 text-right">
                          SL
                        </IonCol>
                        <IonCol size="4" className="p-0 text-right">
                          Đơn Giá
                        </IonCol>
                      </IonRow>
                    </IonGrid>
                  </div>

                  {/* Table Content for this period */}
                  {periodItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <IonGrid className="p-0">
                        <IonRow className="text-xs">
                          <IonCol
                            size="3"
                            className="p-0 text-left text-gray-600"
                          >
                            {item.code}
                          </IonCol>
                          <IonCol size="4" className="p-0 text-gray-800">
                            {item.productName}
                          </IonCol>
                          <IonCol
                            size="1"
                            className="p-0 text-center text-gray-800"
                          >
                            {item.quantity}
                          </IonCol>
                          <IonCol
                            size="4"
                            className="p-0 text-right text-gray-800 font-medium"
                          >
                            {formatCurrencyWithoutSymbol(item.costPrice)}đ
                          </IonCol>
                        </IonRow>
                        {(item.returnedQuantity && item.returnedQuantity > 0) ? (
                          <IonRow className="text-xs mt-1">
                            <IonCol className="p-0">
                              <IonChip color="warning" className="text-xs h-5">
                                Đã trả: {item.returnedQuantity}
                              </IonChip>
                            </IonCol>
                          </IonRow>
                        ) : null}
                      </IonGrid>
                    </div>
                  ))}
                </div>
              ))}

            {/* Show message if no items */}
            {Object.keys(items).length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Chưa có sản phẩm nào
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-800">
                Chi Tiết Thu Tiền
              </h3>
            </div>

            {transactions.length > 0 ? (
              <>
                {/* Payment Header */}
                <div className="bg-green-50 px-4 py-3">
                  <IonGrid className="p-0">
                    <IonRow className="text-xs font-medium text-green-700">
                      <IonCol size="3" className="p-0">
                        Ngày Thu
                      </IonCol>
                      <IonCol size="3" className="p-0">
                        Số Tiền
                      </IonCol>
                      <IonCol size="3" className="p-0 text-center">
                        Hình Thức
                      </IonCol>
                      <IonCol size="3" className="p-0 text-center">
                        Trạng Thái
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </div>

                {/* Payment Content */}
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <IonGrid className="p-0">
                      <IonRow className="text-xs">
                        <IonCol size="3" className="p-0 text-gray-800">
                          {dayjsFormat(transaction.processedAt)}
                        </IonCol>
                        <IonCol
                          size="4"
                          className="p-0 text-gray-800 font-medium"
                        >
                          {formatCurrency(transaction.amount)}
                        </IonCol>
                        <IonCol size="3" className="p-0 text-gray-600">
                          {getPaymentMethodLabel(transaction.paymentMethod)}
                        </IonCol>
                        <IonCol size="2" className="p-0">
                          <IonChip
                            color={getTransactionStatusColor(
                              transaction.status
                            )}
                            className="text-xs rounded-full"
                          >
                            {getTransactionStatusLabel(transaction.status)}
                          </IonChip>
                        </IonCol>
                      </IonRow>
                      {transaction.description && (
                        <IonRow className="text-xs text-gray-500 mt-1">
                          <IonCol className="p-0">
                            {transaction.description}
                          </IonCol>
                        </IonRow>
                      )}
                    </IonGrid>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                Chưa có lịch sử thanh toán
              </div>
            )}
          </div>

          {/* Summary */}
          <IonCard className="shadow-sm">
            <IonCardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-800">
                    Tổng công nợ
                  </span>
                  <span className="text-xl font-bold text-red-500">
                    {receipt?.totalAmount &&
                      formatCurrency(receipt?.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Đã Thu:</span>
                  <span className="text-green-500 font-semibold">
                    {receipt?.paidAmount && formatCurrency(receipt?.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Còn Lại:</span>
                  <span className="text-blue-500 font-semibold">
                    {receipt?.remainingAmount &&
                      formatCurrency(receipt?.remainingAmount)}
                  </span>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

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
    </IonPage>
  );
};

export default ReceiptDebtDetail;
