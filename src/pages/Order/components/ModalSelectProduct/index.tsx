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
    dismiss(data, "confirm");
  };

  return (
    <ModalCustom
      title="Chọn sản phẩm"
      dismiss={dismiss}
      onSearchChange={handleSearch}
      // onConfirm={() => dismiss(selectedValue, "confirm")}
      // data={selectedValue}
    >
      <IonList>
        {!!products.length &&
          products.map((item) => (
            <ProductItem key={item.id} onClick={handleClickItem} {...item} />
          ))}
      </IonList>
    </ModalCustom>
  );
};

export default ModalSelectProduct;
