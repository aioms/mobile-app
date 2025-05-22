import React, { useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
  IonTextarea,
  IonChip,
  IonCard,
  IonCardContent,
  IonActionSheet,
  IonText,
} from "@ionic/react";
import {
  chevronBack,
  ellipsisHorizontal,
  image,
  barcode,
  createOutline,
  trashOutline,
  printOutline,
} from "ionicons/icons";
import { useParams } from "react-router";

import useProduct from "@/hooks/apis/useProduct";
import BarcodeModal from "./components/BarcodeModal";
import InventoryHistory from "./components/InventoryHistory";

import "./ProductDetail.css";

interface Product {
  id: string;
  code: string;
  productCode: string;
  productName: string;
  costPrice: number;
  sellingPrice: number;
  status: string;
  category: string;
  inventory: number;
  unit: string;
  additionalDescription: string;
  supplier: {
    id: string;
    name: string;
  };
}

interface HistoryItem {
  receiptNumber: string;
  quantity: number;
  value: number;
  status: string;
}

interface HistoryData {
  import: HistoryItem[];
  return: HistoryItem[];
  check: HistoryItem[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedTab, setSelectedTab] = useState("import");

  const [history, setHistory] = useState<HistoryData>({
    import: [],
    return: [],
    check: [],
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState({
    import: true,
    return: true,
    check: true,
  });
  const [page, setPage] = useState({
    import: 1,
    return: 1,
    check: 1,
  });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  const { getDetail, getHistory } = useProduct();

  const fetchProductDetail = async () => {
    try {
      const result = await getDetail(id);

      if (!result) {
        return await Toast.show({
          text: "Không tìm thấy sản phẩm",
          duration: "short",
          position: "top",
        });
      }

      setProduct(result);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  useEffect(() => {
    id && fetchProductDetail();
  }, [id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const result = await getHistory({ productId: id, type: selectedTab });

      if (!result || !result.length) {
        return;
      }

      const data = result.map((item: Record<string, any>) => {
        const entries = Object.entries(item);
        const secondEntry = entries[1];
        const [, receipt] = secondEntry;

        return {
          receiptNumber: receipt.receiptNumber,
          quantity: receipt.quantity,
          value: receipt.totalAmount,
          status: receipt.status,
        };
      });

      setHistory((prev) => ({
        ...prev,
        [selectedTab]: data,
      }));
      setHasMore((prev) => ({
        ...prev,
        [selectedTab]: data.length === 10,
      }));
      setPage((prev) => ({
        ...prev,
        [selectedTab]: 1,
      }));
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedTab]);

  const handleLoadMore = async () => {
    try {
      setLoading(true);
      // Simulate API call - Replace with your actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const nextPage = page[selectedTab as keyof typeof page] + 1;

      // Update page for the current tab
      setPage((prev) => ({
        ...prev,
        [selectedTab]: nextPage,
      }));

      // Example: If no more data, set hasMore to false
      if (nextPage > 3) {
        setHasMore((prev) => ({
          ...prev,
          [selectedTab]: false,
        }));
      }
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (action: string) => {
    switch (action) {
      case "edit":
        // Handle edit action
        console.log("Edit clicked");
        break;
      case "delete":
        // Handle delete action
        console.log("Delete clicked");
        break;
      case "print":
        // Handle print action
        console.log("Print clicked");
        break;
    }

    setShowActionSheet(false);

    await Toast.show({
      text: "Tính năng này đang được phát triển",
      duration: "short",
      position: "center",
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/tabs/product" className="text-gray-600">
              <IonIcon slot="icon-only" icon={chevronBack} />
            </IonButton>
          </IonButtons>
          <IonTitle className="font-medium text-gray-800">
            Chi tiết sản phẩm
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              className="text-gray-600"
              onClick={() => setShowActionSheet(true)}
            >
              <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {/* Product Image Section */}
        <div className="mb-6">
          <div className="relative w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
            <IonIcon icon={image} className="text-6xl text-gray-400" />
          </div>
        </div>
        {/* Basic Info Card */}
        <IonCard className="rounded-xl shadow-sm">
          <IonCardContent className="p-4">
            {/* Product Name */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <IonLabel className="text-xs text-gray-500">
                  Tên sản phẩm
                </IonLabel>
                <IonButton
                  fill="clear"
                  size="small"
                  className="text-blue-600"
                  onClick={() => setShowBarcodeModal(true)}
                >
                  <IonIcon icon={barcode} slot="start" />
                  Mã vạch
                </IonButton>
              </div>
              <IonText>
                <h3 className="font-medium text-lg">{product?.productName}</h3>
              </IonText>
            </div>

            {/* Product Code */}
            <div className="mb-4">
              <IonLabel className="text-xs text-gray-500">Mã sản phẩm</IonLabel>
              <IonText>
                <p className="text-sm">{product?.code}</p>
              </IonText>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <IonLabel className="text-xs text-gray-500 block mb-2">
                Nhóm hàng
              </IonLabel>
              <div className="flex flex-wrap gap-2">
                <IonChip className="bg-blue-50 text-blue-600">
                  {product?.category}
                </IonChip>
              </div>
            </div>

            {/* Supplier */}
            <div className="mb-4">
              <IonLabel className="text-xs text-gray-500 block mb-2">
                Nhà cung cấp
              </IonLabel>
              <IonText>
                <p className="text-sm">{product?.supplier?.name}</p>
              </IonText>
            </div>

            {/* Notes */}
            <div>
              <IonLabel className="text-xs text-gray-500 block mb-2">
                Ghi chú
              </IonLabel>
              <IonTextarea
                placeholder="Nhập ghi chú..."
                rows={3}
                className="border rounded-lg px-2"
                value={product?.additionalDescription}
              />
            </div>
          </IonCardContent>
        </IonCard>

        <InventoryHistory
          data={history}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onChangeTab={(e) => setSelectedTab(e.detail.value as string)}
          selectedTab={selectedTab}
        />

        <BarcodeModal
          isOpen={showBarcodeModal}
          onDidDismiss={() => setShowBarcodeModal(false)}
          productName={product?.productName}
          productCode={product?.code}
        />

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Sửa",
              icon: createOutline,
              handler: () => handleActionClick("edit"),
              cssClass: "action-sheet-button",
            },
            {
              text: "Xóa",
              icon: trashOutline,
              role: "destructive",
              handler: () => handleActionClick("delete"),
              cssClass: "action-sheet-destructive",
            },
            {
              text: "In tem mã",
              icon: printOutline,
              handler: () => handleActionClick("print"),
              cssClass: "action-sheet-button",
            },
            {
              text: "Hủy",
              role: "cancel",
              cssClass: "action-sheet-cancel",
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;
