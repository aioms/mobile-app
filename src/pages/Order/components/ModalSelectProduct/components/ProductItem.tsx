import React, { useMemo } from "react";
import { IonCheckbox, IonCol, IonGrid, IonItem, IonRow } from "@ionic/react";
import { getS3ImageUrl } from "@/helpers/fileHelper";
import { formatCurrency } from "@/helpers/formatters";

interface ItemListProps {
  id: string;
  productName: string;
  productCode: string;
  code: string;
  inventory: number;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  retailPrice?: number;
  discount: number;
  // TODO: Remove after merge
  imageUrls?: string[];
  images?: Array<{
    id: string;
    path: string;
  }>;
  isSelected?: boolean;
  onClick?: (data: any) => void;
}

const ProductItem: React.FC<ItemListProps> = ({
  id,
  productName,
  productCode,
  code,
  costPrice = 0,
  sellingPrice = 0,
  retailPrice = 0,
  discount = 0,
  inventory = 0,
  unit,
  imageUrls,
  images,
  isSelected = false,
  onClick,
}) => {
  const imageUrl = useMemo(() => {
    if (imageUrls && imageUrls.length > 0) {
      return imageUrls[0];
    }

    if (images && images.length > 0) {
      return getS3ImageUrl(images[0].path);
    }

    return "https://placehold.co/96x96?text=No+Image";
  }, [imageUrls, images])

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
          retailPrice,
          discount,
          inventory,
          unit,
          images,
          quantity: 1,
        })
      }
    >
      <IonCheckbox
        slot="start"
        checked={isSelected}
        className="mr-2"
      />
      <IonGrid className="p-0">
        <IonRow>
          <IonCol size="12" className="flex">
            <img
              alt={`Image of ${productName}`}
              className="w-24 h-24 rounded object-cover border border-gray-200"
              src={imageUrl}
            />
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-balance">{productName}</p>
              <p className="text-xs text-gray-500">{code}</p>
              <div className="mt-1">
                <p className="text-md font-semibold text-blue-600">
                  Giá sỉ: {formatCurrency(sellingPrice)}
                </p>
                {retailPrice > 0 && retailPrice !== sellingPrice && (
                  <p className="text-md text-gray-500">
                    Giá lẻ: {formatCurrency(retailPrice)}
                  </p>
                )}
              </div>
              <div className="mt-1">
                {inventory === 0 ? (
                  <span className="text-md text-red-500">
                    Tồn: {inventory}
                  </span>
                ) : (
                  <span className="text-md text-gray-600">
                    Tồn: {inventory}
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
