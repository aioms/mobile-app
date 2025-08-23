import React from "react";
import {
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonList,
  IonSpinner,
  IonButton,
} from "@ionic/react";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import { getStatusColor, getStatusLabel, ReceiptStatus } from "@/common/constants/receipt";

interface HistoryItem {
  receiptNumber: string;
  quantity: number;
  value: number;
  status: string;
}

interface HistoryData {
  import: HistoryItem[];
  return: HistoryItem[];
  check: HistoryItem[];
}

interface Props {
  data: HistoryData;
  loading?: boolean;
  hasMore: {
    import: boolean;
    return: boolean;
    check: boolean;
  };
  onLoadMore: () => Promise<void>;
  onChangeTab: (e: any) => void;
  selectedTab: string;
}

const InventoryHistory: React.FC<Props> = ({
  data,
  loading = false,
  hasMore,
  onLoadMore,
  onChangeTab,
  selectedTab,
}) => {
  return (
    <IonCard className="rounded-xl mt-4 shadow-sm">
      <IonCardContent className="p-4">
        <IonSegment
          value={selectedTab}
          onIonChange={onChangeTab}
        >
          <IonSegmentButton value="import">
            <IonLabel className="text-xs text-wrap">Lịch sử nhập</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="return">
            <IonLabel className="text-xs text-wrap">Lịch sử xuất</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="check">
            <IonLabel className="text-xs text-wrap">Lịch sử kiểm</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <div className="mt-4">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
            <div className="text-sm font-medium text-gray-500">Mã phiếu</div>
            <div className="text-sm font-medium text-gray-500">Số lượng</div>
            <div className="text-sm font-medium text-gray-500">Giá trị</div>
            <div className="text-sm font-medium text-gray-500">Trạng thái</div>
          </div>

          {/* Table Content */}
          <IonList className="mt-1">
            {data[selectedTab as keyof HistoryData].map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-100"
              >
                <div className="text-sm">{item.receiptNumber}</div>
                <div className="text-sm">{item.quantity}</div>
                <div className="text-sm">{formatCurrencyWithoutSymbol(item.value)}</div>
                <div>
                  <IonLabel
                    color={getStatusColor(item.status as ReceiptStatus)}
                    className="text-sm"
                  >
                    {getStatusLabel(item.status as ReceiptStatus)}
                  </IonLabel>
                </div>
              </div>
            ))}
          </IonList>

          {/* Load More */}
          {data[selectedTab as keyof typeof data].length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm">
              Không có dữ liệu
            </div>
          )}

          {hasMore[selectedTab as keyof typeof hasMore] && (
            <div className="flex justify-center mt-2">
              <IonButton
                fill="clear"
                onClick={onLoadMore}
                disabled={loading}
                className="text-sm"
              >
                {loading ? (
                  <>
                    <IonSpinner name="crescent" className="mr-2" />
                    Đang tải...
                  </>
                ) : data[selectedTab as keyof typeof data].length > 0 && (
                  "Xem thêm"
                )}
              </IonButton>
            </div>
          )}

          {!hasMore[selectedTab as keyof typeof hasMore] &&
            data[selectedTab as keyof typeof data].length > 0 && (
              <div className="text-center text-gray-500 mt-4">
                <small>Đã hiển thị tất cả</small>
              </div>
            )}

        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default InventoryHistory;
