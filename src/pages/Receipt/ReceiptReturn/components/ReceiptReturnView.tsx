import ExchangeProductSection from "./ExchangeProductSection";
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonPage,
  IonRadio,
  IonRadioGroup,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { addCircleOutline, checkmarkCircleOutline } from "ionicons/icons";

import DatePicker from "@/components/DatePicker";
import ErrorMessage from "@/components/ErrorMessage";
import { ReceiptReturnStatus } from "@/types/receipt-return.type";
import { PaymentMethod } from "@/common/enums/payment";
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

      <IonContent className="ion-padding bg-background">
        {/* Customer Information Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Khách hàng
            </h2>
            <div className="p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {customerName}
            </div>
          </div>
        </div>

        {/* Product Selection Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-md font-medium text-foreground">
                Sản phẩm trả
              </h2>
              <IonButton
                fill="clear"
                size="small"
                onClick={openModalSelectProduct}
              >
                <IonIcon icon={addCircleOutline} slot="start" />
                Chọn sản phẩm
              </IonButton>
            </div>

            <ErrorMessage message={errors.products} />

            {selectedProducts.length > 0
              ? (
                <div className="mt-2">
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
                </div>
              )
              : (
                <div className="text-center text-gray-500 py-4 text-sm">
                  Chưa chọn sản phẩm nào
                </div>
              )}
          </div>
        </div>

        {/* Refund Summary */}
        {selectedProducts.length > 0 && (
          <div className="mb-4">
            <RefundSummarySection
              totalProduct={totalProduct}
              totalQuantity={totalQuantity}
              totalAmount={totalAmount}
              isDebt={isDebt}
            />
          </div>
        )}

        <ExchangeProductSection
          isExchange={isExchange}
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
          <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span>Tổng phiếu sau đổi/trả (dự kiến)</span>
              <strong>{formatCurrency(projectedTotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span>{projectedRemaining < 0 ? "Đã thu dư" : "Còn cần thu"}</span>
              <strong>{formatCurrency(Math.abs(projectedRemaining))}</strong>
            </div>
            <p className="text-xs text-gray-500">
              Giữ nguyên tiền đã thu, VAT và chiết khấu gốc. {projectedRemaining > 0
                ? "Phiếu chuyển chờ thanh toán."
                : projectedRemaining < 0
                ? "Bạn có thể lập phiếu chi để hoàn khách."
                : "Phiếu hoàn thành."}
            </p>
          </div>
        )}
        {/* Return Details Section */}
        <div className="bg-card rounded-lg shadow-sm mb-4">
          {/* Payment Method */}
          {!isDebt && (!isExchange || exchangeDifference !== 0) && (
            <div className="p-4">
              <h2 className="text-md font-medium text-foreground mb-3">
                Phương thức thanh toán
              </h2>
              <IonRadioGroup
                value={formData.paymentMethod}
                onIonChange={(e) => handleFormChange("paymentMethod", e.detail.value)}
              >
                <div className="flex gap-4">
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary": formData.paymentMethod === PaymentMethod.CASH,
                      border: formData.paymentMethod === PaymentMethod.BANK_TRANSFER,
                    })}
                  >
                    <IonRadio value={PaymentMethod.CASH}>Tiền mặt</IonRadio>
                  </IonItem>
                  <IonItem
                    lines="none"
                    className={cn(`rounded-lg transition-colors`, {
                      "bg-custom-primary border border-custom-primary":
                        formData.paymentMethod === PaymentMethod.BANK_TRANSFER,
                      border: formData.paymentMethod === PaymentMethod.CASH,
                    })}
                  >
                    <IonRadio value={PaymentMethod.BANK_TRANSFER}>Chuyển khoản</IonRadio>
                  </IonItem>
                </div>
              </IonRadioGroup>
            </div>
          )}

          {/* Return Reason */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Lý do trả hàng
            </h2>
            <ReturnReasonSelect
              canExchange={canExchange}
              value={formData.reason}
              onChange={(value) => handleFormChange("reason", value)}
              error={errors.reason}
            />
          </div>

          {/* Return Date */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Ngày trả hàng
            </h2>
            <DatePicker
              value={formData.returnDate}
              presentation="date"
              onChange={(e) => handleFormChange("returnDate", e.detail.value)}
              attrs={{ id: "return-date" }}
              extraClassName="w-full flex items-center justify-start"
            />
            <ErrorMessage message={errors.returnDate} />
          </div>

          {/* Notes */}
          <div className="p-4">
            <h2 className="text-md font-medium text-foreground mb-2">
              Ghi chú
            </h2>
            <IonTextarea
              name="note"
              value={formData.note}
              onIonInput={(e) => handleFormChange("note", e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
              rows={3}
              maxlength={500}
              className="border border-input rounded-lg px-2"
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {formData.note.length}/500
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
              onClick={() => handleSubmit(ReceiptReturnStatus.DRAFT)}
            >
              Lưu nháp
            </IonButton>
          )}
          <IonButton
            expand="block"
            size="default"
            onClick={() => handleSubmit(ReceiptReturnStatus.COMPLETED)}
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
