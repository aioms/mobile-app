import { IonButton } from "@ionic/react";
import { AppRadioGroup } from "@/components/UI";
import { OrderType } from "@/common/enums/order";

export default function OrderTypeSection({ value, onChange }: { value: OrderType; onChange: (value: string | number) => void }) {
  return <div className="bg-card rounded-lg shadow-sm p-4 mb-4">
    <h2 className="text-lg font-medium mb-3">Loại đơn hàng <span className="text-red-500">*</span></h2>
    <AppRadioGroup name="Loại đơn hàng" value={value} onChange={onChange} options={[{ value: OrderType.SALES, label: "Bán hàng" }, { value: OrderType.INTERNAL_TRANSFER, label: "Chuyển kho nội bộ" }]} />
    <IonButton fill="outline" expand="block" routerLink="/tabs/orders/dmsg/create" data-cy="select-dmsg" className="mt-3">Đơn gộp ĐMSG</IonButton>
    <p className="text-xs text-gray-500 mt-2">ĐMSG: xuất kho ngay khi lưu nháp, tài chính theo tổng đơn.</p>
  </div>;
}
