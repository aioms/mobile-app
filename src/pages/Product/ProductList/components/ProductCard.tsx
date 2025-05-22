import { FC } from "react";
import { useHistory } from "react-router";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";

interface ProductCardProps {
  product: {
    id: string;
    code: string;
    productCode: string;
    productName: string;
    costPrice: number;
    sellingPrice: number;
    status: string;
    category: string;
    inventory?: number;
    unit?: string;
  };
}

const ProductCard: FC<ProductCardProps> = ({ product }) => {
  const history = useHistory();

  const handleClick = () => {
    history.push(`/tabs/product/${product.id}`);
  };

  const getInventoryStatus = (inventory: number = 0) => {
    if (inventory === 0) return { color: "text-red-500", status: "Hết hàng" };
    if (inventory <= 5)
      return { color: "text-orange-500", status: "Sắp hết hàng" };
    return { color: "text-green-500", status: "Còn hàng" };
  };

  const inventoryStatus = getInventoryStatus(product.inventory);

  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4" onClick={handleClick}>
      {/* Image placeholder */}
      <div className="w-20 h-20 bg-gray-100 rounded-xl flex-shrink-0 flex items-center justify-center">
        <span className="text-2xl text-gray-400">+</span>
      </div>

      {/* Product details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          {/* Product name - truncate if too long */}
          <h3 className="font-medium text-base line-clamp-2">
            {product.productName}
          </h3>

          {/* Quantity and status */}
          <div className="flex flex-col items-end flex-shrink-0">
            <span
              className={`font-medium whitespace-nowrap ${inventoryStatus.color}`}
            >
              {product.inventory} {product.unit || "Cái"}
            </span>
            <span className={`text-sm ${inventoryStatus.color}`}>
              {inventoryStatus.status}
            </span>
          </div>
        </div>
        {/* Product code */}
        <p className="text-gray-500 text-sm mt-1">{product.code}</p>
        {/* Prices */}
        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-gray-500 text-xs">Giá vốn</p>
            <p className="font-medium">
              {formatCurrencyWithoutSymbol(product.costPrice)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">Giá bán</p>
            <p className="font-medium">
              {formatCurrencyWithoutSymbol(product.sellingPrice)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
