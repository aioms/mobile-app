import React from "react";
import { IonCol, IonGrid, IonItem, IonRow } from "@ionic/react";

interface ItemListProps {
  id: string;
  productName: string;
  productCode: string;
  code: string;
  inventory: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  discount: number;
  onClick?: (data: any) => void;
}

const ProductItem: React.FC<ItemListProps> = ({
  id,
  productName,
  productCode,
  code,
  costPrice = 0,
  sellingPrice = 0,
  discount = 0,
  inventory = 0,
  unit,
  onClick,
}) => {
  return (
    <IonItem
      lines="none"
      className="py-2 border-b-2 border-gray-500/10"
      onClick={() =>
        onClick?.({
          id,
          productName,
          productCode,
          code,
          costPrice,
          sellingPrice,
          discount,
          inventory,
          unit,
          quantity: 1,
        })
      }
    >
      <IonGrid>
        <IonRow>
          <IonCol size="12" className="flex">
            <img
              alt={`Image of ${productName}`}
              className="w-24 h-24 rounded object-contain"
              src="https://placehold.co/50x50"
            />
            <div className="ml-2">
              <p className="text-sm font-medium text-balance">{productName}</p>
              <p className="text-xs text-gray-500">{code}</p>
              <div className="mt-2">
                {inventory === 0 ? (
                  <span className="text-red-500">
                    Tồn: {inventory} {unit}
                  </span>
                ) : (
                  <span>
                    Tồn: {inventory} {unit}
                  </span>
                )}
              </div>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonItem>
  );
};

export default ProductItem;
