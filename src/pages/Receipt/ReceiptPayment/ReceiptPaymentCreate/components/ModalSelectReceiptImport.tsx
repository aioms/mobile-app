import React, { useState, useEffect } from "react";
import {
  IonList,
  IonItem,
  IonCheckbox,
  useIonToast,
  IonNote,
  IonText,
} from "@ionic/react";
import dayjs from "dayjs";

import ModalCustom from "@/components/Modal/ModalCustom";
import { formatCurrency } from "@/helpers/formatters";
import useReceiptPayment from "@/hooks/apis/useReceiptPayment";

export interface IReceiptImportMock {
  id: string;
  code: string;
  totalAmount: number;
  createdAt: string;
  supplierId: string;
}

interface IModalSelectReceiptImportProps {
  dismiss: (data?: IReceiptImportMock[], role?: string) => void;
  supplierId: string;
  initialSelectedIds?: string[];
}

const ModalSelectReceiptImport: React.FC<IModalSelectReceiptImportProps> = ({
  dismiss,
  supplierId,
  initialSelectedIds = [],
}) => {
  const [keyword, setKeyword] = useState("");
  const [receipts, setReceipts] = useState<IReceiptImportMock[]>([]);
  const [selectedReceipts, setSelectedReceipts] = useState<IReceiptImportMock[]>([]);
  const [allUnpaidReceipts, setAllUnpaidReceipts] = useState<IReceiptImportMock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [presentToast] = useIonToast();
  const { getUnpaidReceiptImports } = useReceiptPayment();

  useEffect(() => {
    const fetchUnpaid = async () => {
      if (!supplierId) return;
      setIsLoading(true);
      try {
        const response = await getUnpaidReceiptImports(supplierId);
        if (response && response.success && response.data) {
          const mapped = response.data.map((item: any) => ({
            id: item.id,
            code: item.receiptNumber,
            totalAmount: Number(item.totalAmount),
            createdAt: item.createdAt,
            supplierId: item.supplier?.id || supplierId,
          }));
          setAllUnpaidReceipts(mapped);
          
          if (initialSelectedIds.length > 0) {
            const selected = mapped.filter((r: any) => initialSelectedIds.includes(r.id));
            setSelectedReceipts(selected);
          }
        } else {
          setAllUnpaidReceipts([]);
        }
      } catch (err) {
        console.error("Error fetching unpaid imports:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUnpaid();
  }, [supplierId, getUnpaidReceiptImports, initialSelectedIds]);

  useEffect(() => {
    const filtered = allUnpaidReceipts.filter(
      (r) => r.code.toLowerCase().includes(keyword.toLowerCase())
    );
    setReceipts(filtered);
  }, [keyword, allUnpaidReceipts]);

  const handleSearch = (e: any) => {
    setKeyword(e.detail.value || "");
  };

  const toggleSelection = (receipt: IReceiptImportMock) => {
    setSelectedReceipts((prev) => {
      const isSelected = prev.some((r) => r.id === receipt.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== receipt.id);
      } else {
        return [...prev, receipt];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedReceipts.length === 0) {
      presentToast({
        message: "Vui lòng chọn ít nhất 1 phiếu nhập",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }
    dismiss(selectedReceipts, "confirm");
  };

  return (
    <ModalCustom
      title="Chọn phiếu nhập"
      dismiss={() => dismiss(undefined, "cancel")}
      onSearchChange={handleSearch}
      onConfirm={handleConfirm}
    >
      {selectedReceipts.length > 0 && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg text-blue-700 text-sm font-medium mx-4 mt-2">
          Đã chọn: {selectedReceipts.length} phiếu
          (Tổng: {formatCurrency(selectedReceipts.reduce((sum, r) => sum + r.totalAmount, 0))})
        </div>
      )}

      {isLoading && allUnpaidReceipts.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          Đang tải danh sách...
        </div>
      ) : receipts.length === 0 ? (
        <div className="text-center p-4 text-gray-500">
          Không tìm thấy phiếu nhập nào chưa thanh toán
        </div>
      ) : (
        <IonList>
          {receipts.map((item) => {
            const isChecked = selectedReceipts.some((r) => r.id === item.id);
            return (
              <IonItem key={item.id} lines="full" button onClick={() => toggleSelection(item)}>
                <div className="py-2 w-full pr-4">
                  <div className="flex justify-between items-center mb-1">
                    <IonText className="font-semibold text-gray-900">{item.code}</IonText>
                    <IonText className="font-bold text-red-600">
                      {formatCurrency(item.totalAmount)}
                    </IonText>
                  </div>
                  <IonNote className="text-sm">
                    Ngày nhập: {dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}
                  </IonNote>
                </div>
                <IonCheckbox 
                  slot="end" 
                  checked={isChecked} 
                  onClick={(e) => e.stopPropagation()} 
                  onIonChange={(e) => {
                    e.stopPropagation();
                    toggleSelection(item);
                  }} 
                />
              </IonItem>
            );
          })}
        </IonList>
      )}
    </ModalCustom>
  );
};

export default ModalSelectReceiptImport;

