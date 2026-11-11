import { IonButton, IonIcon } from "@ionic/react";
import { cubeOutline, scanOutline, searchOutline, trashOutline } from "ionicons/icons";
import { AppCard } from "@/components/UI";
import type { IOrderItem } from "@/types/order.type";

interface Props {
  items: IOrderItem[]; disabled: boolean; onSearch: () => void; onScan: () => void;
  onChange: (items: IOrderItem[]) => void;
}
export default function InventoryItems({ items, disabled, onSearch, onScan, onChange }: Props) {
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return <AppCard>
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-base font-bold text-gray-900">Sản phẩm xuất kho</h2>
      <span className="text-xs text-gray-500 font-medium">
        {items.length} mặt hàng {totalQuantity > 0 ? `· ${totalQuantity} đơn vị` : ""}
      </span>
    </div>
    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-3 mb-3">Lưu nháp sẽ trừ tồn ngay. Hoàn thành không xuất kho lần nữa.</p>
    {!disabled && <div className="flex gap-2 mb-3"><IonButton fill="outline" expand="block" className="flex-1" onClick={onSearch} data-cy="dmsg-select-products"><IonIcon icon={searchOutline} slot="start" />Chọn sản phẩm</IonButton><IonButton fill="outline" onClick={onScan} aria-label="Quét mã vạch"><IonIcon icon={scanOutline} /></IonButton></div>}
    {!items.length && <div className="text-center py-6 text-sm text-gray-500">Chưa có sản phẩm. Chọn hàng hoặc quét mã để thêm.</div>}
    <div className="space-y-3">{items.map((item) => <div key={item.productId} className="border border-gray-100 rounded-xl p-3 bg-white">
      <div className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <IonIcon icon={cubeOutline} className="text-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-snug">{item.productName}</p>
          <p className="text-xs text-gray-500 mt-0.5">Mã: {item.code}</p>
        </div>
        {!disabled && <IonButton fill="clear" color="danger" size="small" aria-label={`Xóa ${item.productName}`} onClick={() => onChange(items.filter((row) => row.productId !== item.productId))} className="m-0 -mr-2"><IonIcon icon={trashOutline} /></IonButton>}
      </div>
      <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-gray-100">
        <label className="text-xs font-medium text-gray-700">Số lượng xuất kho</label>
        <input type="number" inputMode="numeric" min="1" step="1" required disabled={disabled} value={item.quantity || ""} data-cy="dmsg-quantity"
          onChange={(event) => onChange(items.map((row) => row.productId === item.productId ? { ...row, quantity: Number(event.target.value) } : row))}
          className="w-24 h-10 border border-gray-200 rounded-lg px-3 text-right text-sm font-semibold bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-colors" />
      </div>
    </div>)}</div>
  </AppCard>;
}
