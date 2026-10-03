import { IonButton, IonIcon } from "@ionic/react";
import { calendarOutline, removeCircleOutline } from "ionicons/icons";
import { AppBadge, AppCard } from "@/components/UI";
import ReturnExchangeHistory from "@/components/ReturnExchangeHistory";
import { dayjsFormat, formatCurrency, formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import { getDate } from "@/helpers/date";
import {
  getStatusColor,
  getStatusLabel,
  RECEIPT_DEBT_STATUS,
  RECEIPT_DEBT_TYPE,
  TReceiptDebtStatus,
} from "@/common/constants/receipt-debt.constant";
import { getPaymentMethodLabel, getTransactionStatusColor, getTransactionStatusLabel } from "@/helpers/paymentHelpers";
import type { Transaction } from "@/types/transaction.type";
import type { ReceiptReturnStatus } from "@/types/receipt-return.type";
import type { ResponseData } from "../receiptDebtDetail.types";

interface Props extends ResponseData {
  periods: NonNullable<ResponseData["periods"]>;
  totalVatAmount: number;
  totalDiscountAmount: number;
  transactions: Transaction[];
  isLoading: boolean;
  onReturnStatusChange: (id: string, status: ReceiptReturnStatus) => void;
  returnActionLoading: boolean;
  setIsCancelModalOpen: (open: boolean) => void;
}
export default function ReceiptDebtContent(
  {
    receipt,
    items,
    periods,
    totalVatAmount,
    totalDiscountAmount,
    transactions,
    isLoading,
    setIsCancelModalOpen,
    returnHistory,
    onReturnStatusChange,
    returnActionLoading,
  }: Props,
) {
  return (
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
            {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT ? "Khách hàng" : "Nhà cung cấp"}
          </span>
          <span className="text-base font-semibold text-gray-900 mt-0.5 block leading-snug">
            {receipt?.type === RECEIPT_DEBT_TYPE.CUSTOMER_DEBT ? receipt?.customerName : receipt?.supplierName}
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

      {!!returnHistory?.length && (
        <ReturnExchangeHistory
          entries={returnHistory}
          onStatusChange={receipt?.status !== RECEIPT_DEBT_STATUS.CANCELLED ? onReturnStatusChange : undefined}
          isLoading={returnActionLoading}
        />
      )}
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
                  <div className="flex flex-wrap justify-end gap-1">
                    <span className="text-xs font-bold text-blue-700 bg-white/90 px-2.5 py-0.5 rounded-full shadow-xs border border-blue-200/60 whitespace-nowrap">
                      CK: {formatCurrency(periods[period].discountAmount || 0)}
                    </span>
                    <span className="text-xs font-bold text-blue-700 bg-white/90 px-2.5 py-0.5 rounded-full shadow-xs border border-blue-200/60 whitespace-nowrap">
                      VAT: {formatCurrency(periods[period].vatAmount || 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Period Items */}
              <div className="divide-y divide-gray-100">
                {periodItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 ${item.metadata?.shipNow ? "bg-orange-50/40" : "bg-white"}`}
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
                          {item.returnedQuantity && item.returnedQuantity > 0
                            ? (
                              <AppBadge color="warning" variant="outline" className="text-[10px] px-2 py-0.5">
                                Đã trả: {item.returnedQuantity}
                              </AppBadge>
                            )
                            : null}
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

        {transactions.length > 0
          ? (
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
          )
          : (
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
          <span data-cy="debt-total" className="text-xl font-black text-red-600">
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
        {totalDiscountAmount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Tổng chiết khấu</span>
            <span className="font-semibold text-gray-800">
              -{formatCurrency(totalDiscountAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">Đã thu</span>
          <span data-cy="debt-paid" className="font-bold text-emerald-600">
            {receipt?.paidAmount != null &&
              formatCurrency(receipt.paidAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-base font-bold text-gray-800">Còn lại</span>
          <span data-cy="debt-remaining" className="text-xl font-black text-blue-600">
            {receipt?.remainingAmount != null &&
              formatCurrency(receipt.remainingAmount)}
          </span>
        </div>
      </AppCard>

      {receipt && receipt.paidAmount > receipt.totalAmount && (
        <p className="text-xs text-gray-500 px-1">
          Đã thu dư {formatCurrency(receipt.paidAmount - receipt.totalAmount)}{" "}
          so với tổng phiếu sau đổi/trả. Bạn có thể lập phiếu chi để hoàn khách.
        </p>
      )}
      {/* Cancel debt receipt section */}
      {receipt?.status === RECEIPT_DEBT_STATUS.CANCELLED
        ? (
          null
        )
        : (
          <div>
            <IonButton
              expand="block"
              fill="outline"
              className="rounded-lg text-red-600"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isLoading}
            >
              {isLoading
                ? (
                  "Đang xử lý..."
                )
                : (
                  <>
                    <IonIcon icon={removeCircleOutline} slot="start" />
                    Hủy phiếu
                  </>
                )}
            </IonButton>
          </div>
        )}
    </div>
  );
}
