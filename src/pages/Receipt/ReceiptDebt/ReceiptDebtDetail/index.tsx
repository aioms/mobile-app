import React, { useState, useCallback } from "react";
import { useHistory, useParams } from "react-router";
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonToast, useIonActionSheet, useIonViewWillEnter } from "@ionic/react";
import { chevronBack, ellipsisVertical } from "ionicons/icons";

import ExportReceiptBillModal from "../components/ExportReceiptBill/ExportReceiptBillModal";
import { useAuth } from "@/hooks";
import CancelConfirmationModal from "./components/CancelConfirmationModal";
import { formatCurrency } from "@/helpers/formatters";
import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { useLoading } from "@/hooks";
import { RECEIPT_DEBT_STATUS, RECEIPT_DEBT_TYPE } from "@/common/constants/receipt-debt.constant";

import PaymentModal, { PaymentMethod } from "./components/PaymentModal";
import { PayDebtRequestDto, PaymentTransactionDto } from "@/types/payment.type";
import { Transaction } from "@/types/transaction.type";
import { PaymentMethod as PaymentMethodEnum } from "@/common/enums/payment";
import { TransactionType } from "@/common/enums/transaction";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import { Refresher } from "@/components/Refresher/Refresher";

import { ResponseData } from "./receiptDebtDetail.types";
import useDebtReturnActions from "./hooks/useDebtReturnActions";
import ReceiptDebtContent from "./components/ReceiptDebtContent";
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
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
        setLoadError(null);
        const result = await getDetail(id);
        setHasLoaded(true);

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
        setLoadError(err instanceof Error ? err.message : "Không thể tải phiếu thu");
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

  const returnActions = useDebtReturnActions(fetchReceiptDetail);

  useIonViewWillEnter(() => {
    if (id) void fetchReceiptDetail();
  }, [id, fetchReceiptDetail]);

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
            quantity: item.quantity,
            price: item.costPrice,
            returnedQuantity: returnedQty, // Pass along for display
            periodId: item.receiptPeriodId,
            periodDate: period,
          };
        })
      )
      .filter(item => item.quantity > (item.returnedQuantity || 0));

    presentActionSheet({
      header: "Tùy chọn",
      buttons: [
        ...(receipt && receipt.remainingAmount > 0 ? [{
          text: "Thanh toán",
          role: "selected",
          handler: () => {
            setIsPaymentModalOpen(true);
          },
        }] : []),
        {
          text: "Chỉnh sửa",
          handler: () => {
            history.push(`/tabs/debt/update/${id}`);
          },
        },
        ...(receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT && flattenedProducts.length ? [{
          text: "Đổi/trả hàng",
          handler: () => {
            history.push({
              pathname: `/tabs/receipt/return`,
              state: {
                refId: id,
                refType: 'debt',
                debtTotal: receipt?.totalAmount,
                debtPaidAmount: receipt?.paidAmount,
                debtStatus: receipt?.status,
                customerId: receipt?.customer?.id,
                customerName: receipt?.customer?.name || receipt?.customerName || "Khách lẻ",
                orderProducts: flattenedProducts,
              },
            });
          },
        }] : []),
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

  const { receipt, items, periods = {} } = receiptData;

  const totalVatAmount = Object.values(periods).reduce(
    (sum, period) => sum + (period?.vatAmount || 0),
    0
  );
  const totalDiscountAmount = Object.values(periods).reduce(
    (sum, period) => sum + (period?.discountAmount || 0),
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
          {receipt && receipt.status !== RECEIPT_DEBT_STATUS.CANCELLED && (
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

        {loadError && <div className="p-4 text-center" role="alert">
          <p>{loadError}</p><IonButton onClick={() => void fetchReceiptDetail()}>Thử lại</IonButton>
        </div>}
        {!isLoading && !loadError && hasLoaded && !receipt && <div className="p-4 text-center">
          <p>Không tìm thấy phiếu thu</p><IonButton onClick={() => history.goBack()}>Trở lại danh sách</IonButton>
        </div>}
        <ReceiptDebtContent receipt={receipt} items={items} periods={periods}
          totalVatAmount={totalVatAmount} totalDiscountAmount={totalDiscountAmount}
          transactions={transactions} isLoading={isLoading} setIsCancelModalOpen={setIsCancelModalOpen}
          returnHistory={receiptData.returnHistory} onReturnStatusChange={returnActions.changeStatus}
          returnActionLoading={returnActions.isLoading} />
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
