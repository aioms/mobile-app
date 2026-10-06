import ExchangeProductSection from "./ExchangeProductSection";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { addCircleOutline, checkmarkCircleOutline } from "ionicons/icons";

import DatePicker from "@/components/DatePicker";
import ErrorMessage from "@/components/ErrorMessage";
import { ReceiptReturnStatus } from "@/types/receipt-return.type";
import { PaymentMethod } from "@/common/enums/payment";
import { AppRadioGroup } from "@/components/UI";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/helpers/formatters";
import ReturnReasonSelect from "./ReturnReasonSelect";
import RefundSummarySection from "./RefundSummarySection";
import ProductReturnItem from "./ProductReturnItem";

import type useReceiptReturnForm from "../hooks/useReceiptReturnForm";

export default function ReceiptReturnView({
  isLoading,
  formData,
  customerName,
  selectedProducts,
  errors,
  exchangeProducts,
  isExchange,
  preserveVat,
  setPreserveVat,
  isDebt,
  canExchange,
  totalProduct,
  totalQuantity,
  totalAmount,
  exchangeAmount,
  exchangeDifference,
  projectedTotal,
  projectedRemaining,
  openModalSelectProduct,
  handleProductQuantityChange,
  handleRemoveProduct,
  openModalSelectExchangeProduct,
  updateExchangeProduct,
  removeExchangeProduct,
  handleFormChange,
  handleSubmit,
}: ReturnType<typeof useReceiptReturnForm>) {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/orders" />
          </IonButtons>
          <IonTitle>Tạo phiếu đổi/trả hàng</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <div className="px-4 py-3 space-y-3">
          {/* Customer Information Card */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-gray-500 block">Khách hàng</span>
                <span className="text-sm font-semibold text-gray-900 truncate block">{customerName}</span>
              </div>
              {formData.refId && (
                <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {formData.refType === "debt" ? "Công nợ" : "Đơn hàng"}
                </span>
              )}
            </div>
          </div>

          {/* Product Selection Section */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-semibold text-gray-900">
                  Sản phẩm trả
                </h2>
                {selectedProducts.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
                    {selectedProducts.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                data-cy="return-select-products"
                onClick={openModalSelectProduct}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
              >
                <IonIcon icon={addCircleOutline} className="text-sm" />
                <span>Chọn sản phẩm</span>
              </button>
            </div>

            <ErrorMessage message={errors.products} />

            {selectedProducts.length > 0 ? (
              <div className="mt-2 space-y-2.5">
                {selectedProducts.map((product) => (
                  <ProductReturnItem
                    key={product.id}
                    id={product.id}
                    productName={product.productName}
                    code={product.code}
                    quantity={product.quantity}
                    costPrice={product.costPrice}
                    originalQuantity={product.originalQuantity}
                    onQuantityChange={handleProductQuantityChange}
                    onRemove={handleRemoveProduct}
                  />
                ))}

                {/* Subtotal line inside return card if exchanging */}
                {isExchange && (
                  <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Tổng giá trị hàng trả</span>
                    <span className="font-bold text-gray-900 text-sm">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-4 text-xs">
                Chưa chọn sản phẩm trả nào
              </div>
            )}
          </div>

          {/* Refund Summary - Only shown for pure return, avoiding duplicate total in exchange */}
          {selectedProducts.length > 0 && !isExchange && (
            <RefundSummarySection
              totalProduct={totalProduct}
              totalQuantity={totalQuantity}
              totalAmount={totalAmount}
              isDebt={isDebt}
            />
          )}

          <ExchangeProductSection
            isExchange={isExchange}
            preserveVat={preserveVat}
            setPreserveVat={setPreserveVat}
            isDebt={isDebt}
            exchangeProducts={exchangeProducts}
            errors={errors}
            openModalSelectExchangeProduct={openModalSelectExchangeProduct}
            updateExchangeProduct={updateExchangeProduct}
            removeExchangeProduct={removeExchangeProduct}
            totalAmount={totalAmount}
            exchangeAmount={exchangeAmount}
            exchangeDifference={exchangeDifference}
          />

          {isDebt && selectedProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tổng phiếu sau đổi/trả (dự kiến)</span>
                <strong className="text-sm text-gray-900">{formatCurrency(projectedTotal)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{projectedRemaining < 0 ? "Đã thu dư" : "Còn cần thu"}</span>
                <strong className="text-sm text-blue-600">{formatCurrency(Math.abs(projectedRemaining))}</strong>
              </div>
              <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 leading-relaxed">
                Giữ nguyên tiền đã thu, VAT và chiết khấu gốc. {projectedRemaining > 0
                  ? "Phiếu chuyển chờ thanh toán."
                  : projectedRemaining < 0
                  ? "Bạn có thể lập phiếu chi để hoàn khách."
                  : "Phiếu hoàn thành."}
              </p>
            </div>
          )}

          {/* Return Details Section */}
          <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 space-y-3.5">
            {/* Payment Method */}
            {!isDebt && (!isExchange || exchangeDifference !== 0) && (
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  Phương thức thanh toán
                </label>
                <AppRadioGroup
                  name="Phương thức thanh toán"
                  size="sm"
                  options={[
                    { value: PaymentMethod.CASH, label: "Tiền mặt" },
                    { value: PaymentMethod.BANK_TRANSFER, label: "Chuyển khoản" },
                  ]}
                  value={formData.paymentMethod}
                  onChange={(val) => handleFormChange("paymentMethod", val)}
                />
              </div>
            )}

            {/* Return Reason */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Lý do trả hàng
              </label>
              <ReturnReasonSelect
                canExchange={canExchange}
                value={formData.reason}
                onChange={(value) => handleFormChange("reason", value)}
                error={errors.reason}
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                Ngày trả hàng
              </label>
              <DatePicker
                value={formData.returnDate}
                presentation="date"
                onChange={(e) => handleFormChange("returnDate", e.detail.value)}
                attrs={{ id: "return-date" }}
                extraClassName="w-full flex items-center justify-start border border-gray-200 rounded-lg px-2 h-9 bg-gray-50 text-sm"
              />
              <ErrorMessage message={errors.returnDate} />
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  Ghi chú
                </label>
                <span className="text-[11px] text-gray-400">
                  {formData.note.length}/500
                </span>
              </div>
              <IonTextarea
                name="note"
                value={formData.note}
                onIonInput={(e) => handleFormChange("note", e.target.value)}
                placeholder="Nhập ghi chú (nếu có)"
                rows={2}
                maxlength={500}
                className="border border-gray-200 rounded-lg px-2.5 py-1 bg-gray-50 text-sm focus:bg-white"
              />
            </div>
          </div>
        </div>
      </IonContent>

      <IonFooter>
        <div className="ion-padding flex gap-2">
          {isDebt && !isExchange && (
            <IonButton
              expand="block"
              fill="outline"
              disabled={isLoading}
              data-cy="return-save-draft" onClick={() => handleSubmit(ReceiptReturnStatus.DRAFT)}
            >
              Lưu nháp
            </IonButton>
          )}
          <IonButton
            expand="block"
            size="default"
            data-cy="return-confirm" onClick={() => handleSubmit(ReceiptReturnStatus.COMPLETED)}
            disabled={isLoading}
            className="flex-1"
          >
            <IonIcon icon={checkmarkCircleOutline} slot="start" />
            Xác nhận
          </IonButton>
        </div>
      </IonFooter>
    </IonPage>
  );
}
