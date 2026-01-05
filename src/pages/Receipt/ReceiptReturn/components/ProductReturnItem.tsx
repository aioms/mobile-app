import { FC, useState, useEffect } from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { trashOutline } from "ionicons/icons";
import { formatCurrency, formatCurrencyWithoutSymbol } from "@/helpers/formatters";

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

  const handleQuantityChange = (value: number) => {
    if (value >= minQuantity && value <= maxQuantity) {
      updateQuantity(value);
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
    <div className="border-b border-gray-200 py-3 px-1 rounded-md">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-medium">{productName}</div>
          <div className="text-xs text-gray-500">Mã SP: {code}</div>
        </div>
        <IonButton
          fill="clear"
          color="danger"
          size="small"
          onClick={() => onRemove(id)}
        >
          <IonIcon icon={trashOutline} />
        </IonButton>
      </div>

      <div className="grid grid-cols-1 gap-2 items-center">
        {/* Quantity Block */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500 min-w-max">Số lượng</span>
            {originalQuantity && (
              <span className="text-xs text-gray-400">
                Tối đa: {originalQuantity}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleQuantityChange(newQuantity - 1)}
              style={{ border: "none" }}
              disabled={newQuantity <= minQuantity}
              aria-label="Giảm số lượng"
            >
              –
            </button>
            <input
              type="number"
              value={quantityInputValue}
              onChange={(e) => handleQuantityInputChange(e.target.value)}
              onBlur={handleQuantityInputBlur}
              min={minQuantity}
              max={maxQuantity}
              className={`w-12 h-8 mx-1 text-center text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent ${quantityError
                ? "border-red-400 bg-red-50"
                : "border-gray-300"
                }`}
              aria-label="Số lượng sản phẩm"
              autoComplete="off"
            />
            <button
              type="button"
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleQuantityChange(newQuantity + 1)}
              style={{ border: "none" }}
              disabled={newQuantity >= maxQuantity}
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>
          {quantityError && (
            <div className="mt-1">
              <span className="text-xs text-red-600">{quantityError}</span>
            </div>
          )}
        </div>

        {/* Price Display */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Đơn giá</span>
          <span className="text-sm font-medium">
            {formatCurrency(costPrice)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-gray-500">
          {formatCurrency(costPrice)} × {newQuantity}
        </div>
        <div className="font-medium text-green-600">
          Tổng: {formatCurrency(totalPrice)}
        </div>
      </div>
    </div>
  );
};

export default ProductReturnItem;
