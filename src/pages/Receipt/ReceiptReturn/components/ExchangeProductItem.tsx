import { FC, useState, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";

import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";

import type { ExchangeProductSelection } from "./ModalSelectExchangeProduct";

interface Props {
  product: ExchangeProductSelection;
  onChange: (
    id: string,
    field: "quantity" | "unitPrice" | "vatRate",
    value: number,
  ) => void;
  onRemove: (id: string) => void;
}

export const getExchangeProductTotals = (product: ExchangeProductSelection) => {
  const subtotal = product.quantity * product.unitPrice;
  const vatAmount = Math.round((subtotal * (product.vatRate || 0)) / 100);

  return {
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
  };
};

const VAT_PRESETS = [0, 8, 10];

const ExchangeProductItem: FC<Props> = ({ product, onChange, onRemove }) => {
  const totals = getExchangeProductTotals(product);

  const [quantityInput, setQuantityInput] = useState<string>(
    product.quantity.toString(),
  );
  const [vatInput, setVatInput] = useState<string>(
    (product.vatRate ?? 0).toString(),
  );

  useEffect(() => {
    setQuantityInput(product.quantity.toString());
  }, [product.quantity]);

  useEffect(() => {
    setVatInput((product.vatRate ?? 0).toString());
  }, [product.vatRate]);

  const maxQuantity = Math.max(1, Number(product.inventory || 0));
  const isExceedingStock = product.quantity > Number(product.inventory || 0);

  const handleQuantityStep = (delta: number) => {
    const next = Math.min(maxQuantity, Math.max(1, product.quantity + delta));
    onChange(product.id, "quantity", next);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuantityInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1) {
      onChange(product.id, "quantity", Math.min(maxQuantity, num));
    }
  };

  const handleQuantityBlur = () => {
    const num = parseInt(quantityInput, 10);
    if (isNaN(num) || num < 1) {
      onChange(product.id, "quantity", 1);
      setQuantityInput("1");
    } else if (num > maxQuantity) {
      onChange(product.id, "quantity", maxQuantity);
      setQuantityInput(maxQuantity.toString());
    } else {
      setQuantityInput(product.quantity.toString());
    }
  };

  const handleVatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVatInput(val);
    if (val.trim() === "") return;
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onChange(product.id, "vatRate", num);
    }
  };

  const handleVatBlur = () => {
    if (vatInput.trim() === "" || isNaN(Number(vatInput))) {
      onChange(product.id, "vatRate", 0);
      setVatInput("0");
    } else {
      const num = Math.min(100, Math.max(0, Number(vatInput)));
      onChange(product.id, "vatRate", num);
      setVatInput(num.toString());
    }
  };

  const handleVatPreset = (rate: number) => {
    onChange(product.id, "vatRate", rate);
    setVatInput(rate.toString());
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-xs p-3.5 mb-3 transition-all">
      {/* Product Header: Title, SKU, Inventory limit & Delete */}
      <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug">
            {product.productName}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px]">
              Mã SP: {product.code || "N/A"}
            </span>
            <span className="text-gray-300">•</span>
            <span
              className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isExceedingStock
                  ? "bg-red-50 text-red-700"
                  : (product.inventory || 0) <= 3
                  ? "bg-amber-50 text-amber-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              Tồn có thể đổi: {product.inventory}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(product.id)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
          aria-label={`Xóa ${product.productName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Input controls */}
      <div className="pt-3 space-y-3">
        {/* Row 1: Quantity Stepper */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-600">Số lượng đổi</span>
            {isExceedingStock && (
              <span className="block text-[11px] text-red-500 font-medium">
                Vượt quá tồn kho ({product.inventory})
              </span>
            )}
          </div>

          <div className="flex items-center bg-gray-50 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={product.quantity <= 1}
              className="w-8 h-8 rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={quantityInput}
              onChange={handleQuantityChange}
              onBlur={handleQuantityBlur}
              min={1}
              max={maxQuantity}
              className="w-12 h-8 text-center text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
              aria-label="Số lượng"
            />
            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              disabled={product.quantity >= maxQuantity}
              className="w-8 h-8 rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Price & VAT side-by-side in balanced columns */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Unit Price */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              Đơn giá (chưa VAT)
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                inputMode="numeric"
                value={formatCurrencyWithoutSymbol(product.unitPrice)}
                onChange={(e) =>
                  onChange(
                    product.id,
                    "unitPrice",
                    parseCurrencyInput(e.target.value || ""),
                  )
                }
                className="w-full h-9 pl-2.5 pr-6 text-sm font-semibold text-gray-900 bg-gray-50/70 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-2 text-xs text-gray-400 font-medium pointer-events-none">
                đ
              </span>
            </div>
          </div>

          {/* VAT (%) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-600">Thuế VAT</label>
              <div className="flex items-center gap-1">
                {VAT_PRESETS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleVatPreset(rate)}
                    className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                      product.vatRate === rate
                        ? "bg-blue-600 text-white font-semibold"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.01"
                value={vatInput}
                onChange={handleVatChange}
                onBlur={handleVatBlur}
                className="w-full h-9 pl-2.5 pr-6 text-sm font-semibold text-gray-900 bg-gray-50/70 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-2 text-xs text-gray-400 font-medium pointer-events-none">
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calculations Breakdown */}
      <div className="mt-3 bg-slate-50/90 rounded-lg p-2.5 border border-slate-100 space-y-1.5">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Tiền hàng ({product.quantity} × {formatCurrency(product.unitPrice)})</span>
          <span className="font-medium text-gray-700">{formatCurrency(totals.subtotal)}</span>
        </div>
        {totals.vatAmount > 0 && (
          <div className="flex justify-between text-xs text-gray-500">
            <span>Thuế VAT ({product.vatRate || 0}%)</span>
            <span className="font-medium text-gray-700">+{formatCurrency(totals.vatAmount)}</span>
          </div>
        )}
        <div className="border-t border-slate-200/80 pt-1.5 flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-700">Thành tiền đổi</span>
          <span className="text-sm font-bold text-blue-600">{formatCurrency(totals.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default ExchangeProductItem;
