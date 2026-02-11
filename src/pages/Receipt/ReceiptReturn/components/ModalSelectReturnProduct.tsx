import React, { FC, useState } from "react";
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
} from "@ionic/react";
import { IReceiptReturnItem } from "@/types/receipt-return.type";
import { formatCurrency } from "@/helpers/formatters";
import { getNumberFromStringOrThrow } from "@/helpers/common";

interface OrderItem {
  id: string;
  productId: string;
  code: string;
  productName: string;
  quantity: number;
  price: number;
  returnedQuantity?: number;
}

interface Props {
  dismiss: (data?: any, role?: string) => void;
  orderProducts: Array<OrderItem>;
}

const ModalSelectReturnProduct: FC<Props> = ({ dismiss, orderProducts }) => {
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, IReceiptReturnItem>
  >(new Map());

  const handleToggleProduct = (product: OrderItem, checked: boolean) => {
    const newSelected = new Map(selectedProducts);
    const productId = product.productId || product.id;

    if (checked) {
      const returnItem: IReceiptReturnItem = {
        id: product.id || product.productId,
        productId: product.productId || product.id,
        code: product.code,
        productCode: getNumberFromStringOrThrow(product.code),
        productName: product.productName,
        quantity: product.quantity, // Default to original quantity
        costPrice: product.price,
        originalQuantity: product.quantity,
      };
      newSelected.set(productId, returnItem);
    } else {
      newSelected.delete(productId);
    }

    setSelectedProducts(newSelected);
  };

  const handleConfirm = () => {
    const items = Array.from(selectedProducts.values());
    dismiss(items, "confirm");
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
      <IonContent className="ion-padding">
        {orderProducts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Không có sản phẩm để trả
          </div>
        ) : (
          <IonList>
            {orderProducts.map((product) => {
              const productId = product.productId || product.id;
              const isSelected = selectedProducts.has(productId);
              const returnedQty = product.returnedQuantity || 0;
              const returnableQty = product.quantity - returnedQty;
              const isDisabled = returnableQty <= 0;

              return (
                <IonItem
                  key={productId}
                  lines="full"
                  className={isDisabled ? "opacity-50" : ""}
                >
                  <IonCheckbox
                    slot="start"
                    checked={isSelected}
                    disabled={isDisabled}
                    onIonChange={(e) =>
                      handleToggleProduct(
                        { ...product, quantity: returnableQty },
                        e.detail.checked
                      )
                    }
                  />
                  <IonLabel>
                    <h2 className={`font-medium ${isDisabled ? "text-gray-400" : ""}`}>
                      {product.productName}
                    </h2>
                    <p className="text-sm text-gray-500">Mã SP: {product.code}</p>
                    <p className="text-sm text-gray-600">
                      Số lượng có thể trả: {returnableQty}
                      {returnedQty > 0 && (
                        <span className="text-orange-500 ml-2">
                          (Đã trả: {returnedQty})
                        </span>
                      )}
                      {" | "}
                      {formatCurrency(product.price)}
                    </p>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </>
  );
};

export default ModalSelectReturnProduct;
