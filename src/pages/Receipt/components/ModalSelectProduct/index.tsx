import { useEffect, useRef, useState } from "react";
import { Toast } from "@capacitor/toast";
import { IonList, IonSpinner } from "@ionic/react";

import { PRODUCT_STATUS } from "@/common/constants/product";
import ModalCustom from "@/components/Modal/ModalCustom";
import useProduct from "@/hooks/apis/useProduct";
import ProductItem from "./components/ProductItem";
import { parseArrayData } from "@/helpers/common";

type Props = {
  dismiss: (data?: any, role?: string) => void;
};

const ModalSelectProduct: React.FC<Props> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, any>>(new Map());
  const productsRequestIdRef = useRef(0);

  const { getList: getListProducts } = useProduct();

  const fetchProducts = async () => {
    const requestId = ++productsRequestIdRef.current;
    setIsLoading(true);

    try {
      const response = await getListProducts(
        {
          keyword,
          status: PRODUCT_STATUS.ACTIVE,
        },
        1,
        10
      );

      if (requestId !== productsRequestIdRef.current) return;

      const list = parseArrayData(response);
      setProducts(list);

      if (!list.length) {
        await Toast.show({
          text: "Không tìm thấy kết quả",
          duration: "short",
          position: "top",
        });
      }

    } catch (error) {
      if (requestId !== productsRequestIdRef.current) return;

      setProducts([]);
      await Toast.show({
        text: (error as Error).message || "Có lỗi xảy ra",
        duration: "short",
        position: "top",
      });
    } finally {
      if (requestId === productsRequestIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [keyword]);

  const handleSearch = (e: any) => {
    const keyword = e.detail.value || "";
    setKeyword(keyword);
  };

  const handleClickItem = (data: any) => {
    const productId = data.id;
    setSelectedProducts(prev => {
      const newMap = new Map(prev);
      if (newMap.has(productId)) {
        newMap.delete(productId);
      } else {
        newMap.set(productId, data);
      }
      return newMap;
    });
  };

  const handleConfirm = () => {
    const selectedItems = Array.from(selectedProducts.values())
      .map(product => ({
        ...product,
        quantity: 1,
        totalPrice: product.costPrice,
      }));

    if (selectedItems.length === 0) {
      Toast.show({
        text: "Vui lòng chọn ít nhất một sản phẩm",
        duration: "short",
        position: "top",
      });
      return;
    }

    dismiss(selectedItems, "confirm");
  };

  return (
    <ModalCustom
      title="Thêm sản phẩm"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      onConfirm={handleConfirm}
      data={selectedProducts.size > 0}
    >
      <div className="mb-2 px-4 py-2 bg-gray-100 rounded">
        <p className="text-sm text-gray-600">
          Đã chọn: <span className="font-semibold">{selectedProducts.size}</span> sản phẩm
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><IonSpinner name="crescent" /></div>
      ) : (
        <IonList>
          {!!products.length &&
          products.map((item) => (
            <ProductItem
              key={item.id}
              onClick={handleClickItem}
              isSelected={selectedProducts.has(item.id)}
              {...item}
            />
          ))}
        </IonList>
      )}
    </ModalCustom>
  );
};

export default ModalSelectProduct;
