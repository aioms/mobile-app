import { useState, useEffect } from "react";
import { IonList } from "@ionic/react";
import { Toast } from "@capacitor/toast";

import useProduct from "@/hooks/apis/useProduct";
import ModalCustom from "@/components/Modal/ModalCustom";
import ProductItem from "./components/ProductItem";

type Props = {
  dismiss: (data?: any, role?: string) => void;
};

const ModalSelectProduct: React.FC<Props> = ({ dismiss }) => {
  const [keyword, setKeyword] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, any>>(new Map());

  const { getList: getListProducts } = useProduct();

  const fetchProducts = async () => {
    try {
      const response = await getListProducts(
        {
          keyword,
        },
        1,
        25
      );

      if (!response.length) {
        await Toast.show({
          text: "Không tìm thấy kết quả",
          duration: "short",
          position: "top",
        });
      }

      setProducts(response);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
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
      title="Chọn sản phẩm"
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
    </ModalCustom>
  );
};

export default ModalSelectProduct;
