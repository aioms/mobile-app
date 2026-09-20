import { FC, useEffect, useRef, useState } from "react";
import { IonList, IonSpinner } from "@ionic/react";
import { Toast } from "@capacitor/toast";

import ModalCustom from "@/components/Modal/ModalCustom";
import ProductItem from "@/pages/Order/components/ModalSelectProduct/components/ProductItem";
import useProduct from "@/hooks/apis/useProduct";
import { parseArrayData } from "@/helpers/common";
import { IProduct } from "@/types/product.type";

export type ExchangeProductSelection = IProduct & {
  quantity: number;
  unitPrice: number;
};

interface Props {
  dismiss: (data?: unknown, role?: string) => void;
  getSelectedProducts?: () => ExchangeProductSelection[];
}

const ModalSelectExchangeProduct: FC<Props> = ({
  dismiss,
  getSelectedProducts,
}) => {
  const initialSelectedProducts = getSelectedProducts?.() || [];
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, ExchangeProductSelection>>(
    () => new Map(initialSelectedProducts.map((product) => [product.id, product])),
  );
  const requestIdRef = useRef(0);
  const { getList: getProducts } = useProduct();

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    getProducts({ keyword, status: "active" }, 1, 25)
      .then((response) => {
        if (requestId === requestIdRef.current) {
          setProducts(parseArrayData<IProduct>(response));
        }
      })
      .catch(async (error) => {
        if (requestId !== requestIdRef.current) return;
        setProducts([]);
        await Toast.show({
          text: (error as Error).message || "Không thể tải danh sách sản phẩm",
          duration: "short",
          position: "top",
        });
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, [keyword]);

  const toggleProduct = (product: IProduct) => {
    setSelectedProducts((current) => {
      const next = new Map(current);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, {
          ...product,
          quantity: 1,
          unitPrice: product.sellingPrice,
        });
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedProducts.size === 0) {
      Toast.show({
        text: "Vui lòng chọn ít nhất một sản phẩm đổi",
        duration: "short",
        position: "top",
      });
      return;
    }

    dismiss(Array.from(selectedProducts.values()), "confirm");
  };

  return (
    <ModalCustom
      title="Chọn sản phẩm đổi"
      dismiss={dismiss}
      data={Array.from(selectedProducts.values())}
      onConfirm={handleConfirm}
      onSearchChange={(event) => setKeyword(event.detail.value || "")}
      searchPlaceholder="Tìm sản phẩm đổi..."
    >
      <div className="mb-2 px-4 py-2 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Đã chọn: <span className="font-semibold">{selectedProducts.size}</span> sản phẩm
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><IonSpinner name="crescent" /></div>
      ) : products.some((product) => product.inventory > 0) ? (
        <IonList>
          {products.filter((product) => product.inventory > 0).map((product) => (
            <ProductItem
              key={product.id}
              {...product}
              productCode={String(product.productCode)}
              discount={0}
              isSelected={selectedProducts.has(product.id)}
              onClick={() => toggleProduct(product)}
            />
          ))}
        </IonList>
      ) : (
        <div className="text-center text-gray-500 py-8">Không tìm thấy sản phẩm</div>
      )}
    </ModalCustom>
  );
};

export default ModalSelectExchangeProduct;
