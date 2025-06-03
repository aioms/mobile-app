import { useMemo } from "react";
import { useHistory } from "react-router";

import { Toast } from "@capacitor/toast";
import { IonIcon, useIonToast } from "@ionic/react";
import {
  scanOutline,
  cartOutline,
  statsChartOutline,
  timeOutline,
} from "ionicons/icons";

import { useBarcodeScanner, useStorage } from "@/hooks";
import useProduct from "@/hooks/apis/useProduct";

const QuickActions: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const { addItem, getItem } = useStorage();
  const { getDetail: getProductDetail } = useProduct();

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      presentToast({
        message: error.message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    },
  });

  async function handleBarcodeScanned(
    value: string,
    data?: Record<string, unknown>
  ) {
    stopScan();

    try {
      const result = await getProductDetail(value);

      if (!result) {
        return await Toast.show({
          text: `Không tìm thấy sản phẩm với mã vạch ${value}`,
          duration: "short",
          position: "center",
        });
      }

      switch (data?.type) {
        case "product":
          history.push(`/tabs/product/${result.id}`);
          break;
        case "order":
          if (result.inventory === 0) {
            return await Toast.show({
              text: "Sản phẩm này đã hết hàng",
              duration: "short",
              position: "center",
            });
          }

          const draftOrder = await getItem("order_draft");

          if (draftOrder) {
            const existingItem = draftOrder.items.find(
              (item: { id: string }) => item.id === result.id
            );

            if (existingItem) {
              existingItem.quantity += 1;
            } else {
              draftOrder.items.push({
                id: result.id,
                productId: result.id,
                productName: result.productName,
                code: result.code,
                sellingPrice: result.sellingPrice,
                quantity: 1,
              });
            }

            await addItem("order_draft", draftOrder);
          } else {
            await addItem("order_draft", {
              items: [
                {
                  id: result.id,
                  productId: result.id,
                  productName: result.productName,
                  code: result.code,
                  sellingPrice: result.sellingPrice,
                  quantity: 1,
                },
              ],
            });
          }

          history.push(`/tabs/order/create`);
          break;
        default:
          throw new Error(`Không hỗ trợ loại chức năng này: ${data?.type}`);
      }
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  }

  const actions = useMemo(
    () => [
      {
        icon: scanOutline,
        label: "Quét sản phẩm",
        color: "bg-blue-500",
        onAction: () => startScan({ type: "product" }),
      },
      {
        icon: cartOutline,
        label: "Tạo đơn hàng",
        color: "bg-orange-500",
        onAction: () => startScan({ type: "order" }),
      },
      {
        icon: statsChartOutline,
        label: "Phân tích báo cáo",
        color: "bg-green-500",
        route: "/analytics",
      },
      {
        icon: timeOutline,
        label: "Chấm công",
        color: "bg-blue-500",
        route: "/attendance",
      },
    ],
    []
  );

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold mb-3">Thao tác nhanh</h2>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-4 flex items-center justify-center flex-col"
          >
            <div
              className={`${action.color} p-2 rounded-lg mb-2`}
              onClick={action.onAction}
            >
              <IonIcon icon={action.icon} className="text-white w-6 h-6" />
            </div>
            <span className="text-xs">{action.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
