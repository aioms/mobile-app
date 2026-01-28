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
  IonText,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import { getStatusColor, getStatusLabel, ReceiptStatus } from "@/common/constants/receipt-status-helper";

interface HistoryItem {
  id: string;
  receiptNumber: string;
  quantity: number;
  value: number;
  status: string;
  type: 'order' | 'debt' | 'import' | 'check';
  customer?: {
    id: string;
    name: string;
  };
  suppliers?: {
    id: string;
    name: string;
  };
}

interface HistoryData {
  import: HistoryItem[];
  return: HistoryItem[];
  check: HistoryItem[];
  order: HistoryItem[];
  debt: HistoryItem[];
}

interface Props {
  data: HistoryData;
  loading?: boolean;
  hasMore: {
    import: boolean;
    return: boolean;
    check: boolean;
    order: boolean;
    debt: boolean;
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
  const history = useHistory();

  const getRouteForReceiptType = (item: HistoryItem): string => {
    switch (item.type) {
      case 'order':
        return `/tabs/orders/detail/${item.id}`;
      case 'debt':
        return `/tabs/debt/detail/${item.id}`;
      case 'import':
        return `/tabs/receipt-import/detail/${item.id}`;
      case 'check':
        return `/tabs/receipt-check/detail/${item.id}`;
      default:
        return '#';
    }
  };

  const handleReceiptClick = (item: HistoryItem) => {
    const route = getRouteForReceiptType(item);
    if (route !== '#') {
      history.push(route);
    }
  };

  const renderTable = (tableData: HistoryItem[], title?: string, tableKey?: keyof HistoryData) => (
    <div className="mb-6">
      {title && (
        <div className="mb-3">
          <IonText color="primary">
            <h3 className="text-lg font-semibold">{title}</h3>
          </IonText>
        </div>
      )}

      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-gray-50 rounded-t-lg">
        <div className="text-sm font-medium text-gray-500">Mã phiếu</div>
        <div className="text-sm font-medium text-gray-500">Số lượng</div>
        <div className="text-sm font-medium text-gray-500">Giá</div>
        <div className="text-sm font-medium text-gray-500">Khách hàng</div>
        <div className="text-sm font-medium text-gray-500">Trạng thái</div>
      </div>

      {/* Table Content */}
      <IonList className="mt-1">
        {tableData.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-gray-100"
          >
            <div
              className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
              onClick={() => handleReceiptClick(item)}
            >
              {item.receiptNumber}
            </div>
            <div className="text-sm">{item.quantity}</div>
            <div className="text-sm">{formatCurrencyWithoutSymbol(item.value)}</div>
            <div className="text-sm">{item.customer?.name || item.suppliers?.name || 'Khách lẻ'}</div>
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
      {tableData.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Không có dữ liệu
        </div>
      )}

      {tableKey && hasMore[tableKey] && (
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
            ) : tableData.length > 0 && (
              "Xem thêm"
            )}
          </IonButton>
        </div>
      )}

      {tableKey && !hasMore[tableKey] && tableData.length > 0 && (
        <div className="text-center text-gray-500 mt-4">
          <small>Đã hiển thị tất cả</small>
        </div>
      )}
    </div>
  );

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
          <IonSegmentButton value="export">
            <IonLabel className="text-xs text-wrap">Lịch sử xuất</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="check">
            <IonLabel className="text-xs text-wrap">Lịch sử kiểm</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <div className="mt-4">
          {selectedTab === "export" ? (
            <>
              {renderTable(data.order, "Danh sách đơn hàng", "order")}
              {renderTable(data.debt, "Danh sách phiếu thu", "debt")}
            </>
          ) : (
            renderTable(data[selectedTab as keyof HistoryData], undefined, selectedTab as keyof HistoryData)
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default InventoryHistory;
