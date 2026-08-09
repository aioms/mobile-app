import { FC } from "react";
import { IonIcon } from "@ionic/react";
import { trashOutline } from "ionicons/icons";

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
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-b-0">
            <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-medium text-gray-900 text-sm truncate">{productName}</h3>
                <p className="text-gray-500 text-xs mt-1">{code}</p>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg px-3 py-1.5 min-w-[3.5rem]">
                    <span className="text-xs text-gray-500 mb-0.5">Tồn kho</span>
                    <span className="font-semibold text-gray-700">{inventory}</span>
                </div>
                
                <button
                    onClick={() => onRemoveItem?.(id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
                >
                    <IonIcon icon={trashOutline} className="text-xl" />
                </button>
            </div>
        </div>
    );
};

export default ReceiptCheckItem;
