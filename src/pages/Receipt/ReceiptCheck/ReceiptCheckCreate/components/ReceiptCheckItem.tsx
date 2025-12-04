import { FC } from "react";
import {
    IonFabButton,
    IonIcon,
    IonItem,
} from "@ionic/react";
import { trash } from "ionicons/icons";

type Props = {
    id: string;
    productName: string;
    productCode: string;
    code: string;
    inventory: number;
    onRemoveItem?: (id: string) => void;
};

const ReceiptCheckItem: FC<Props> = ({
    id,
    productName,
    code,
    inventory,
    onRemoveItem,
}) => {
    return (
        <IonItem lines="none" className="border-b border-gray-100">
            <div className="py-3 w-full flex items-center justify-between">
                <div className="flex-1">
                    <h3 className="font-medium text-base">{productName}</h3>
                    <p className="text-gray-500 text-sm">{code}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Inventory Display */}
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                        <span className="font-medium text-gray-700">{inventory}</span>
                    </div>

                    {/* Remove Button */}
                    <IonFabButton
                        size="small"
                        color="danger"
                        onClick={() => {
                            onRemoveItem?.(id);
                        }}
                    >
                        <IonIcon icon={trash} size="small"></IonIcon>
                    </IonFabButton>
                </div>
            </div>
        </IonItem>
    );
};

export default ReceiptCheckItem;
