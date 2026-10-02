import { IonIcon } from "@ionic/react";
import { addCircleOutline } from "ionicons/icons";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import ErrorMessage from "@/components/ErrorMessage";
import { formatCurrency } from "@/helpers/formatters";
import ExchangeProductItem from "./ExchangeProductItem";
import type useReceiptReturnForm from "../hooks/useReceiptReturnForm";

type Props = Pick<
  ReturnType<typeof useReceiptReturnForm>,
  | "isExchange"
  | "isDebt"
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
        <div className="bg-card rounded-lg shadow-sm mb-4 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-md font-semibold text-foreground">Sản phẩm đổi</h2>
              {exchangeProducts.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                  {exchangeProducts.length}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={openModalSelectExchangeProduct}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors"
            >
              <IonIcon icon={addCircleOutline} className="text-base" />
              <span>Chọn sản phẩm</span>
            </button>
          </div>

          <ErrorMessage message={errors.exchangeProducts} />

          {exchangeProducts.length > 0
            ? (
              <div className="mt-2 space-y-3">
                {exchangeProducts.map((product) => (
                  <ExchangeProductItem
                    key={product.id}
                    product={product}
                    onChange={updateExchangeProduct}
                    onRemove={removeExchangeProduct}
                  />
                ))}

                {/* Settlement Balance Summary Card */}
                <div className="rounded-xl border border-blue-100/80 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Đối soát chênh lệch đổi trả
                    </span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>(1) Tổng giá trị hàng trả:</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>(2) Tổng giá trị hàng đổi:</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(exchangeAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200/80 pt-2.5 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-900">
                        {exchangeDifference > 0
                          ? (isDebt ? "Tăng công nợ phiếu thu" : "Khách cần bù thêm (2 - 1)")
                          : exchangeDifference < 0
                          ? (isDebt ? "Giảm công nợ phiếu thu" : "Cửa hàng hoàn lại (1 - 2)")
                          : "Đổi ngang giá"}
                      </div>
                      <span
                        className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          exchangeDifference > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : exchangeDifference < 0
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
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
                  onClick={openModalSelectExchangeProduct}
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
