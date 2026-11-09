import { IonButton, IonIcon } from "@ionic/react";
import { scanOutline, searchOutline, trashOutline } from "ionicons/icons";
import { AppCard } from "@/components/UI";
import type { IOrderItem } from "@/types/order.type";

interface Props {
  items: IOrderItem[]; disabled: boolean; onSearch: () => void; onScan: () => void;
  onChange: (items: IOrderItem[]) => void;
}
export default function InventoryItems({ items, disabled, onSearch, onScan, onChange }: Props) {
  return <AppCard>
    <div className="flex justify-between items-center mb-2"><h2 className="text-lg font-bold">Sản phẩm xuất kho</h2><span className="text-xs text-gray-500">{items.length} mặt hàng</span></div>
    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mb-3">Lưu nháp sẽ trừ tồn ngay. Hoàn thành không xuất kho lần nữa.</p>
    {!disabled && <div className="flex gap-2 mb-3"><IonButton fill="outline" expand="block" className="flex-1" onClick={onSearch} data-cy="dmsg-select-products"><IonIcon icon={searchOutline} slot="start" />Chọn sản phẩm</IonButton><IonButton fill="outline" onClick={onScan} aria-label="Quét mã vạch"><IonIcon icon={scanOutline} /></IonButton></div>}
    {!items.length && <div className="text-center py-6 text-sm text-gray-500">Chưa có sản phẩm. Chọn hàng hoặc quét mã để thêm.</div>}
    <div className="space-y-3">{items.map((item) => <div key={item.productId} className="border border-gray-100 rounded-xl p-3">
      <p className="text-sm font-medium">{item.productName}</p><p className="text-xs text-gray-500 mt-1">Mã: {item.code}</p>
      <div className="flex justify-between items-center mt-2"><label className="flex items-center gap-3 text-sm">Số lượng
        <input type="number" inputMode="numeric" min="1" step="1" required disabled={disabled} value={item.quantity || ""} data-cy="dmsg-quantity"
          onChange={(event) => onChange(items.map((row) => row.productId === item.productId ? { ...row, quantity: Number(event.target.value) } : row))}
          className="w-24 h-11 border border-gray-200 rounded-lg px-3 text-right bg-gray-50" /></label>
        {!disabled && <IonButton fill="clear" color="danger" aria-label={`Xóa ${item.productName}`} onClick={() => onChange(items.filter((row) => row.productId !== item.productId))}><IonIcon icon={trashOutline} /></IonButton>}
      </div>
    </div>)}</div>
  </AppCard>;
}
