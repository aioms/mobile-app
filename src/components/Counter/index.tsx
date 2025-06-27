import { FC, useState } from "react";

type Props = {
  value?: number;
  onChange: (value: number) => void;
};

const Counter: FC<Props> = ({ value, onChange }) => {
  const [newQuantity, setNewQuantity] = useState<number>(value || 1);

  const handleQuantityChange = (value: number | null) => {
    if (value !== null && value >= 1) {
      onChange(value);
      setNewQuantity(value);
    }
  };

  return (
    <>
      <button
        type="button"
        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400"
        onClick={() =>
          handleQuantityChange(newQuantity > 1 ? newQuantity - 1 : 1)
        }
        style={{ border: "none" }}
      >
        –
      </button>
      <span className="w-8 text-center">{newQuantity}</span>
      <button
        type="button"
        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-lg text-teal-400"
        onClick={() => handleQuantityChange(newQuantity + 1)}
        style={{ border: "none" }}
      >
        +
      </button>
    </>
  );
};

export default Counter;
