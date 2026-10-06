import { FC, useState, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";

import {
  formatCurrency,
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";

import type { ExchangeProductSelection } from "./ModalSelectExchangeProduct";

interface Props {
  preserveVat?: boolean;
  product: ExchangeProductSelection;
  onChange: (
    id: string,
    field: "quantity" | "unitPrice" | "vatRate",
    value: number,
  ) => void;
  onRemove: (id: string) => void;
}

const getExchangeProductTotals = (product: ExchangeProductSelection) => {
  const subtotal = product.quantity * product.unitPrice;
  const vatAmount = Math.round((subtotal * (product.vatRate || 0)) / 100);

  return {
    subtotal,
    vatAmount,
    total: subtotal + vatAmount,
  };
};

const VAT_PRESETS = [0, 8, 10];

const ExchangeProductItem: FC<Props> = ({ product, onChange, onRemove, preserveVat = false }) => {
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
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 mb-2.5 transition-all space-y-3">
      {/* Product Header: Title, SKU, Inventory limit & Delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-1">
            {product.productName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
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

      {/* Row 1: Đơn giá & Số lượng */}
      <div className="grid grid-cols-2 gap-2.5 items-end">
        {/* Unit Price */}
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Đơn giá (chưa VAT)
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              data-cy="exchange-price"
              value={formatCurrencyWithoutSymbol(product.unitPrice)}
              onChange={(e) =>
                onChange(
                  product.id,
                  "unitPrice",
                  parseCurrencyInput(e.target.value || ""),
                )
              }
              className="w-full h-9 pl-2.5 pr-6 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <span className="absolute right-2 text-xs text-gray-400 font-medium pointer-events-none">
              đ
            </span>
          </div>
        </div>

        {/* Quantity Stepper */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Số lượng đổi</span>
            {isExceedingStock && (
              <span className="text-[10px] text-red-500 font-medium">
                Vượt tồn
              </span>
            )}
          </div>

          <div className="flex items-center bg-gray-50 h-9 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={product.quantity <= 1}
              className="w-8 h-full rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
              className="flex-1 w-0 h-full text-center text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
              data-cy="exchange-quantity"
              aria-label="Số lượng"
            />
            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              disabled={product.quantity >= maxQuantity}
              className="w-8 h-full rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: VAT Selector & Custom Rate Input */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs font-medium text-gray-600 shrink-0">Thuế VAT:</span>
          <div className="flex items-center gap-1">
            {VAT_PRESETS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleVatPreset(rate)}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  product.vatRate === rate
                    ? "bg-blue-600 text-white font-semibold shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center w-20 shrink-0">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.01"
            data-cy="exchange-vat"
            value={vatInput}
            onChange={handleVatChange}
            onBlur={handleVatBlur}
            className="w-full h-7 pl-2 pr-5 text-xs text-right font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute right-1.5 text-[11px] text-gray-400 font-medium pointer-events-none">
            %
          </span>
        </div>
      </div>

      {/* Item Total (Replaces redundant multi-line calculation box) */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
        <div className="text-gray-500">
          <span className="font-medium text-gray-700">Thành tiền đổi</span>
          {preserveVat ? (
            <span className="text-[11px] text-gray-400 ml-1.5">(chưa VAT)</span>
          ) : totals.vatAmount > 0 ? (
            <span className="text-[11px] text-gray-400 ml-1.5">
              (gồm +{formatCurrency(totals.vatAmount)} VAT)
            </span>
          ) : null}
        </div>
        <div className="text-sm font-bold text-blue-600">
          {formatCurrency(preserveVat ? totals.subtotal : totals.total)}
        </div>
      </div>
    </div>
  );
};

export default ExchangeProductItem;
