import { FC, useState, useMemo } from "react";
import {
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItemGroup,
} from "@ionic/react";
import { IReceiptReturnItem } from "@/types/receipt-return.type";
import { formatCurrency } from "@/helpers/formatters";
import { getNumberFromStringOrThrow } from "@/helpers/common";
import { getDate } from "@/helpers/date";

interface OrderItem {
  id: string;
  productId: string;
  code: string;
  productName: string;
  quantity: number;
  price: number;
  returnedQuantity?: number;
  periodId?: string;
  periodDate?: string;
}

interface Props {
  dismiss: (data?: any, role?: string) => void;
  orderProducts: Array<OrderItem>;
  refType: "order" | "debt";
}

const ModalSelectReturnProduct: FC<Props> = ({ dismiss, orderProducts, refType }) => {
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, IReceiptReturnItem>
  >(new Map());

  const handleToggleProduct = (product: OrderItem, checked: boolean) => {
    const newSelected = new Map(selectedProducts);
    // Use unique ID combining productId and periodId if available
    const uniqueId = product.periodId ? `${product.id}_${product.periodId}` : product.id;

    if (checked) {
      const returnItem: IReceiptReturnItem = {
        id: product.id,
        productId: product.productId,
        code: product.code,
        productCode: getNumberFromStringOrThrow(product.code),
        productName: product.productName,
        quantity: product.quantity,
        costPrice: product.price,
        originalQuantity: product.quantity,
        metadata: {
          returnedQuantity: product.quantity,
          periodId: product.periodId,
        },
      } as any; // Cast as any to allow periodId in metadata if needed or handle it in parent
      newSelected.set(uniqueId, returnItem);
    } else {
      newSelected.delete(uniqueId);
    }

    setSelectedProducts(newSelected);
  };

  const handleConfirm = () => {
    const items = Array.from(selectedProducts.values());
    dismiss(items, "confirm");
  };

  // Group and sort products by period if refType is 'debt'
  const sortedGroupedProducts = useMemo(() => {
    if (refType !== "debt") return [];

    const groups: Record<string, { date: string; items: OrderItem[] }> = {};
    orderProducts.forEach((item) => {
      const pId = item.periodId || "unknown";
      if (!groups[pId]) {
        groups[pId] = {
          date: item.periodDate || "unknown",
          items: [],
        };
      }
      groups[pId].items.push(item);
    });

    return Object.entries(groups).sort(
      ([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [orderProducts, refType]);

  const renderProductItem = (product: OrderItem) => {
    const uniqueId = product.periodId ? `${product.id}_${product.periodId}` : product.id;
    const isSelected = selectedProducts.has(uniqueId);
    const returnedQty = product.returnedQuantity || 0;
    const returnableQty = product.quantity;
    const isDisabled = returnableQty <= 0;

    return (
      <IonItem
        key={uniqueId}
        lines="full"
        className={isDisabled ? "opacity-50" : ""}
      >
        <IonCheckbox
          slot="start"
          checked={isSelected}
          disabled={isDisabled}
          onIonChange={(e) =>
            handleToggleProduct(product, e.detail.checked)
          }
        />
        <IonLabel className="ion-text-wrap">
          <h2 className={`font-medium ${isDisabled ? "text-gray-400" : ""}`}>
            {product.productName}
          </h2>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">Mã: {product.code}</p>
            <p className="text-sm font-semibold text-blue-600">
              {formatCurrency(product.price)}
            </p>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Số lượng có thể trả: <span className="font-medium">{returnableQty}</span>
            {returnedQty > 0 && (
              <span className="text-orange-500 ml-2">
                (Đã trả: {returnedQty})
              </span>
            )}
          </p>
        </IonLabel>
      </IonItem>
    );
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => dismiss(undefined, "cancel")}>
              Hủy
            </IonButton>
          </IonButtons>
          <IonTitle>Chọn sản phẩm trả</IonTitle>
          <IonButtons slot="end">
            <IonButton
              strong={true}
              onClick={handleConfirm}
              disabled={selectedProducts.size === 0}
            >
              Xác nhận
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gray-50">
        <div className="p-4">
          {orderProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed border-gray-300">
              Không có sản phẩm để trả
            </div>
          ) : refType === "debt" && sortedGroupedProducts.length > 0 ? (
            <>
              {sortedGroupedProducts.map(([pId, group]) => (
                <IonItemGroup key={pId} className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <IonItem color="light" lines="full">
                    <IonLabel>
                      <span className="text-sm font-semibold text-blue-700">
                        Đợt: {getDate(group.date).format("DD/MM/YYYY")}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({group.items.length} sản phẩm)
                      </span>
                    </IonLabel>
                  </IonItem>
                  <IonList className="ion-no-padding">
                    {group.items.map(renderProductItem)}
                  </IonList>
                </IonItemGroup>
              ))}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
              <IonList className="ion-no-padding">
                {orderProducts.map(renderProductItem)}
              </IonList>
            </div>
          )}
        </div>
      </IonContent>
    </>
  );
};

export default ModalSelectReturnProduct;
