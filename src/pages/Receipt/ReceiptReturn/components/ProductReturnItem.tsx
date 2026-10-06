import { FC, useState, useEffect } from "react";
import { Trash2, Plus, Minus } from "lucide-react";
import { formatCurrency } from "@/helpers/formatters";

interface Props {
  id: string;
  productName: string;
  code: string;
  quantity: number;
  costPrice: number;
  originalQuantity?: number;
  onQuantityChange: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

const ProductReturnItem: FC<Props> = ({
  id,
  productName,
  code,
  quantity,
  costPrice,
  originalQuantity,
  onQuantityChange,
  onRemove,
}) => {
  const [newQuantity, setNewQuantity] = useState<number>(quantity);
  const [quantityInputValue, setQuantityInputValue] = useState<string>(
    quantity.toString()
  );
  const [quantityError, setQuantityError] = useState<string>("");

  const maxQuantity = originalQuantity || 9999;
  const minQuantity = 1;

  const validateQuantity = (value: number): { isValid: boolean; error?: string } => {
    if (isNaN(value)) {
      return { isValid: false, error: "Vui lòng nhập số hợp lệ" };
    }
    if (value < minQuantity) {
      return { isValid: false, error: `Số lượng tối thiểu là ${minQuantity}` };
    }
    if (value > maxQuantity) {
      return {
        isValid: false,
        error: `Số lượng tối đa là ${maxQuantity}`,
      };
    }
    return { isValid: true };
  };

  const updateQuantity = (value: number) => {
    const validation = validateQuantity(value);

    if (validation.isValid) {
      setNewQuantity(value);
      setQuantityInputValue(value.toString());
      setQuantityError("");
    } else {
      setQuantityError(validation.error || "");
    }
  };

  const handleQuantityInputChange = (value: string) => {
    setQuantityInputValue(value);
    const numericValue = parseInt(value, 10);

    if (value === "" || isNaN(numericValue)) {
      setQuantityError("Vui lòng nhập số hợp lệ");
      return;
    }

    updateQuantity(numericValue);
  };

  const handleQuantityInputBlur = () => {
    if (quantityInputValue === "" || isNaN(parseInt(quantityInputValue, 10))) {
      setQuantityInputValue(newQuantity.toString());
      setQuantityError("");
    }
  };

  const handleQuantityStep = (delta: number) => {
    const next = newQuantity + delta;
    if (next >= minQuantity && next <= maxQuantity) {
      updateQuantity(next);
    }
  };

  useEffect(() => {
    if (quantity !== newQuantity) {
      setNewQuantity(quantity);
      setQuantityInputValue(quantity.toString());
      setQuantityError("");
    }
  }, [quantity]);

  useEffect(() => {
    onQuantityChange(id, newQuantity);
  }, [newQuantity, id]);

  const totalPrice = costPrice * newQuantity;

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 shadow-2xs p-3.5 mb-2.5 transition-all space-y-3">
      {/* Product Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-1">
            {productName}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px]">
              Mã SP: {code || "N/A"}
            </span>
            {originalQuantity && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-[11px] font-medium text-gray-500">
                  Đã mua: {originalQuantity}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onRemove(id)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
          aria-label={`Xóa ${productName}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Row: Đơn giá & Số lượng */}
      <div className="grid grid-cols-2 gap-2.5 items-end">
        <div>
          <span className="text-xs font-medium text-gray-600 block mb-1">Đơn giá trả</span>
          <div className="h-9 px-2.5 flex items-center bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900">
            {formatCurrency(costPrice)}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">Số lượng trả</span>
            {originalQuantity && (
              <span className="text-[10px] text-gray-400">
                Tối đa: {originalQuantity}
              </span>
            )}
          </div>

          <div className="flex items-center bg-gray-50 h-9 p-0.5 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={() => handleQuantityStep(-1)}
              disabled={newQuantity <= minQuantity}
              className="w-8 h-full rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={quantityInputValue}
              onChange={(e) => handleQuantityInputChange(e.target.value)}
              onBlur={handleQuantityInputBlur}
              min={minQuantity}
              max={maxQuantity}
              className="flex-1 w-0 h-full text-center text-sm font-semibold text-gray-900 bg-transparent focus:outline-none"
              data-cy="return-quantity"
              aria-label="Số lượng sản phẩm"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => handleQuantityStep(1)}
              disabled={newQuantity >= maxQuantity}
              className="w-8 h-full rounded-md bg-white shadow-2xs hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {quantityError && (
        <p className="text-[11px] text-red-500 font-medium">{quantityError}</p>
      )}

      {/* Item Total */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          Thành tiền ({newQuantity} × {formatCurrency(costPrice)})
        </span>
        <span className="text-sm font-bold text-gray-900">
          {formatCurrency(totalPrice)}
        </span>
      </div>
    </div>
  );
};

export default ProductReturnItem;
