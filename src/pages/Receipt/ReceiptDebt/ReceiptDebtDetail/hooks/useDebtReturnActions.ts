import { useRef } from "react";
import { useIonAlert } from "@ionic/react";
import { useLoading } from "@/hooks";
import useReceiptReturn from "@/hooks/apis/useReceiptReturn";
import { ReceiptReturnStatus } from "@/types/receipt-return.type";

export default function useDebtReturnActions(onChanged: () => Promise<void>) {
  const [presentAlert] = useIonAlert();
  const { update } = useReceiptReturn();
  const { isLoading, withLoading } = useLoading();
  const submitting = useRef(false);
  const changeStatus = (id: string, status: ReceiptReturnStatus) => {
    void presentAlert({
      header: status === ReceiptReturnStatus.COMPLETED ? "Xác nhận trả hàng" : "Hủy phiếu trả hàng",
      message: status === ReceiptReturnStatus.COMPLETED
        ? "Xác nhận cập nhật hàng trả, tồn kho và công nợ?"
        : "Hủy phiếu trả và khôi phục hàng, tồn kho, công nợ đã điều chỉnh?",
      buttons: [
        { text: "Trở lại", role: "cancel" },
        {
          text: "Xác nhận",
          handler: () => {
            if (submitting.current) return;
            submitting.current = true;
            void withLoading(async () => {
              try {
                await update(id, { status });
                await onChanged();
              } finally {
                submitting.current = false;
              }
            });
          },
        },
      ],
    });
  };
  return { changeStatus, isLoading };
}
