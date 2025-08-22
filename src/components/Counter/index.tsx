import { FC, useState, useEffect } from "react";

type Props = {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const Counter: FC<Props> = ({ value, onChange, disabled = false }) => {
  const [newQuantity, setNewQuantity] = useState<number>(value || 1);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value !== undefined) {
      setNewQuantity(value);
    }
  }, [value]);

  const handleQuantityChange = (value: number | null) => {
    if (!disabled && value !== null && value >= 1) {
      onChange(value);
      setNewQuantity(value);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-teal-400 hover:bg-gray-200"
        }`}
        onClick={() =>
          handleQuantityChange(newQuantity > 1 ? newQuantity - 1 : 1)
        }
        disabled={disabled}
        style={{ border: "none" }}
      >
        –
      </button>
      <span className="w-8 text-center">{newQuantity}</span>
      <button
        type="button"
        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-teal-400 hover:bg-gray-200"
        }`}
        onClick={() => handleQuantityChange(newQuantity + 1)}
        disabled={disabled}
        style={{ border: "none" }}
      >
        +
      </button>
    </>
  );
};

export default Counter;
