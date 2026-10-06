import { IonIcon } from "@ionic/react";
import { addCircleOutline } from "ionicons/icons";
import { ArrowRightLeft, Receipt, RefreshCw } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";
import { formatCurrency } from "@/helpers/formatters";
import ExchangeProductItem from "./ExchangeProductItem";
import type useReceiptReturnForm from "../hooks/useReceiptReturnForm";

type Props = Pick<
  ReturnType<typeof useReceiptReturnForm>,
  | "isExchange"
  | "isDebt"
  | "preserveVat"
  | "setPreserveVat"
  | "exchangeProducts"
  | "errors"
  | "openModalSelectExchangeProduct"
  | "updateExchangeProduct"
  | "removeExchangeProduct"
  | "totalAmount"
  | "exchangeAmount"
  | "exchangeDifference"
>;
export default function ExchangeProductSection(
  {
    isExchange,
    isDebt,
    preserveVat,
    setPreserveVat,
    exchangeProducts,
    errors,
    openModalSelectExchangeProduct,
    updateExchangeProduct,
    removeExchangeProduct,
    totalAmount,
    exchangeAmount,
    exchangeDifference,
  }: Props,
) {
  return (
    <>
      {isExchange && (
        <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs mb-3 p-3.5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-semibold text-gray-900">Sản phẩm đổi</h2>
              {exchangeProducts.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {exchangeProducts.length}
                </span>
              )}
            </div>
            <button
              type="button"
              data-cy="exchange-select-products"
              onClick={openModalSelectExchangeProduct}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              <IonIcon icon={addCircleOutline} className="text-sm" />
              <span>Chọn sản phẩm</span>
            </button>
          </div>

          {!isDebt && (
            <label
              className={`flex items-center justify-between p-3 mb-3 rounded-xl border transition-all cursor-pointer select-none active:bg-gray-50 ${
                preserveVat
                  ? "bg-blue-50/50 border-blue-200/80 shadow-2xs"
                  : "bg-white border-gray-200 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    preserveVat
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900">
                      Giữ nguyên VAT đã xuất hóa đơn
                    </span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full transition-colors ${
                        preserveVat
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {preserveVat ? "Khuyên dùng" : "Tính lại VAT"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                    Chỉ tính chênh lệch tiền hàng. Bỏ chọn để tính cả VAT hai bên.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={preserveVat}
                data-cy="exchange-preserve-vat"
                onChange={(event) => setPreserveVat(event.target.checked)}
                className="w-4.5 h-4.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600 shrink-0 cursor-pointer"
              />
            </label>
          )}
          <ErrorMessage message={errors.exchangeProducts} />

          {exchangeProducts.length > 0
            ? (
              <div className="mt-2 space-y-2.5">
                {exchangeProducts.map((product) => (
                  <ExchangeProductItem
                    key={product.id}
                    product={product}
                    onChange={updateExchangeProduct}
                    onRemove={removeExchangeProduct}
                    preserveVat={!isDebt && preserveVat}
                  />
                ))}

                {/* Settlement Balance Summary Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2.5 mt-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                      <span>Đối soát chênh lệch</span>
                    </div>
                    <span className="text-[11px] text-gray-500">
                      {preserveVat ? "Không tính lại VAT" : "Đã bao gồm VAT"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Tổng giá trị hàng trả</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Tổng giá trị hàng đổi</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(exchangeAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {exchangeDifference > 0
                          ? (isDebt ? "Tăng công nợ phiếu thu" : "Khách cần bù thêm")
                          : exchangeDifference < 0
                          ? (isDebt ? "Giảm công nợ phiếu thu" : "Cửa hàng hoàn lại")
                          : "Đổi ngang giá"}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          exchangeDifference > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : exchangeDifference < 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {exchangeDifference > 0
                          ? (isDebt ? "Thanh toán sau qua phiếu thu" : "Khách thanh toán thêm")
                          : exchangeDifference < 0
                          ? (isDebt ? "Giữ nguyên tiền đã thu" : "Hoàn tiền cho khách")
                          : "Không chênh lệch"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        data-cy="exchange-difference"
                        className={`text-base font-extrabold ${
                          exchangeDifference > 0
                            ? "text-emerald-600"
                            : exchangeDifference < 0
                            ? "text-rose-600"
                            : "text-gray-700"
                        }`}
                      >
                        {exchangeDifference > 0
                          ? `+${formatCurrency(exchangeDifference)}`
                          : exchangeDifference < 0
                          ? `-${formatCurrency(Math.abs(exchangeDifference))}`
                          : "0 đ"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
            : (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50 mt-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-semibold text-gray-800 mb-0.5">
                  Chưa chọn sản phẩm đổi
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  Chọn sản phẩm khách muốn nhận thay thế cho hàng trả
                </div>
                <button
                  type="button"
                  data-cy="exchange-select-products" onClick={openModalSelectExchangeProduct}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-sm transition-all"
                >
                  <IonIcon icon={addCircleOutline} className="text-base" />
                  <span>Chọn sản phẩm ngay</span>
                </button>
              </div>
            )}
        </div>
      )}
    </>
  );
}
