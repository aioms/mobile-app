import React from "react";
import { IonIcon } from "@ionic/react";
import {
  personOutline,
  businessOutline,
  cubeOutline,
  storefrontOutline,
  chevronForwardOutline,
  pricetagOutline,
} from "ionicons/icons";
import { IReceiptReturn, ReceiptReturnType } from "@/types/receipt-return.type";
import { getReturnCardBadgeConfig } from "@/common/constants/receipt-return.constant";
import { formatCurrency, dayjsFormat } from "@/helpers/formatters";

interface ReturnCardProps {
  receipt: IReceiptReturn;
  onClick: (receipt: IReceiptReturn) => void;
}

const ReturnCard: React.FC<ReturnCardProps> = ({ receipt, onClick }) => {
  const isCustomer = receipt.type === ReceiptReturnType.CUSTOMER;
  const partner = isCustomer ? receipt.customer : receipt.supplier;

  const badgeConfig = getReturnCardBadgeConfig(
    receipt.status,
    receipt.operationType,
  );

  const formattedDateTime = dayjsFormat(
    receipt.returnDate || receipt.createdAt,
    "DD/MM/YYYY • HH:mm",
  );

  // Label for money section
  const amountLabel =
    receipt.operationType === "exchange"
      ? "GIÁ TRỊ ĐỔI"
      : "HOÀN TIỀN";

  // Display amount: differenceAmount or totalAmount
  const displayAmount =
    receipt.operationType === "exchange" && receipt.differenceAmount
      ? receipt.differenceAmount
      : receipt.totalAmount;

  // Products preview
  const productNames = receipt.items && receipt.items.length > 0
    ? receipt.items.map((item) => item.productName).join(", ")
    : "Chưa có thông tin sản phẩm";

  // Prefix receipt code with '#' if not present
  const displayReceiptCode = receipt.receiptNumber.startsWith("#")
    ? receipt.receiptNumber
    : `#${receipt.receiptNumber}`;

  return (
    <div
      data-cy="return-card"
      onClick={() => onClick(receipt)}
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm transition-all duration-150 active:scale-[0.99] active:bg-gray-50 cursor-pointer"
    >
      {/* Top row: Code + Date/Time + Status Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">Mã:</span>
            <span
              data-cy="return-card-code"
              className="text-sm font-bold text-blue-600 tracking-tight"
            >
              {displayReceiptCode}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{formattedDateTime}</p>
        </div>

        <span
          data-cy="return-card-badge"
          className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeConfig.bgClass} ${badgeConfig.textClass} ${badgeConfig.borderClass}`}
        >
          {badgeConfig.label}
        </span>
      </div>

      {/* Middle Container: Partner info, Item count, Products preview */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
        {/* Partner Name + Group Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center flex-shrink-0">
              <IonIcon
                icon={isCustomer ? personOutline : businessOutline}
                className="text-xs"
              />
            </div>
            <span
              data-cy="return-card-partner"
              className="text-xs font-semibold text-gray-900 truncate"
            >
              {partner?.name || (isCustomer ? "Khách lẻ" : "Nhà cung cấp")}
            </span>
            {partner?.phone && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                ({partner.phone})
              </span>
            )}
          </div>

          {partner?.group && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 flex-shrink-0">
              {partner.group}
            </span>
          )}
        </div>

        {/* Item count */}
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <IonIcon
            icon={storefrontOutline}
            className="text-gray-400 text-sm flex-shrink-0"
          />
          <span className="text-gray-500">Số mặt hàng:</span>
          <span className="font-semibold text-gray-900">
            {receipt.totalProduct || receipt.items?.length || 0}
          </span>
          {receipt.totalQuantity > 1 && (
            <span className="text-gray-500 text-[11px]">
              (Tổng SL: {receipt.totalQuantity})
            </span>
          )}
        </div>

        {/* Product Names preview box */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-100 flex items-center gap-2">
          <IonIcon
            icon={cubeOutline}
            className="text-gray-400 text-sm flex-shrink-0"
          />
          <p
            className="text-xs text-gray-800 line-clamp-1 font-normal leading-relaxed"
            title={productNames}
          >
            {productNames}
          </p>
        </div>
      </div>

      {/* Bottom row: Total Refund Amount & Detail link */}
      <div className="flex items-center justify-between pt-3 mt-1">
        <div>
          <span className="block text-[10px] font-bold text-gray-500 tracking-wider">
            {amountLabel}
          </span>
          <span
            data-cy="return-card-amount"
            className={`text-base font-bold ${
              receipt.operationType === "exchange"
                ? "text-blue-600"
                : "text-emerald-600"
            }`}
          >
            {formatCurrency(displayAmount)}
          </span>
        </div>

        <button
          type="button"
          data-cy="return-card-detail-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClick(receipt);
          }}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 py-1.5 px-2 rounded-lg active:bg-blue-50"
        >
          <span>Chi tiết</span>
          <IonIcon icon={chevronForwardOutline} className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default ReturnCard;
