import { useState, useEffect } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonListHeader,
  IonLabel,
  RefresherEventDetail,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonItem,
} from "@ionic/react";
import DatePicker from "@/components/DatePicker";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";

import { RECEIPT_CHECK_STATUS, TReceiptCheckStatus } from "@/common/constants/receipt";
import { Refresher } from "@/components/Refresher/Refresher";
import { ItemList } from "./components/ItemList";

import "./ReceiptCheckList.css";

interface ReceiptItem {
  id: string;
  productName: string;
  inventory: number;
  systemInventory: number;
  actualInventory: number;
  costPrice: number;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  systemInventory: number;
  actualInventory: number;
  totalDifference: number;
  totalItems: number;
  checker: {
    id: string;
    fullname: string;
  };
  date: string;
  status: TReceiptCheckStatus;
  items: ReceiptItem[];
}

interface Pagination {
  currentPage: number;
  hasPrevious: boolean;
  hasNext: boolean;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface TimeFilter {
  startDate: string;
  endDate: string;
}

const ReceiptCheckScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>({
    startDate: "",
    endDate: "",
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    hasPrevious: false,
    hasNext: false,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const { getList: getListReceiptCheck } = useReceiptCheck();

  const fetchReceiptChecks = async (
    page: number = 1,
    isLoadMore: boolean = false
  ) => {
    try {
      setIsLoading(true);

      const { data, metadata, success, statusCode } = await getListReceiptCheck(
        {
          keyword: searchText,
          startDate: timeFilter.startDate,
          endDate: timeFilter.endDate,
          status: statusFilter,
        },
        page,
        pagination.limit
      );

      if (!success || statusCode !== 200) {
        throw new Error("Có lỗi xảy ra khi tải dữ liệu");
      }

      setReceipts((prev) => (isLoadMore ? [...prev, ...data] : data));
      setPagination(metadata);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInfiniteScroll = async (ev: any) => {
    if (!pagination.hasNext || isLoading) {
      ev.target.complete();
      return;
    }

    await fetchReceiptChecks(pagination.currentPage + 1, true);
    ev.target.complete();
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    await fetchReceiptChecks(1);
    event.detail.complete();
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleTimeFilterChange = (
    type: "startDate" | "endDate",
    value: string
  ) => {
    setTimeFilter((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  useEffect(() => {
    fetchReceiptChecks(1);
  }, [timeFilter, statusFilter, searchText]);

  return (
    <>
      <Refresher onRefresh={handleRefresh} />

      <IonSearchbar
        value={searchText}
        onIonChange={(e) => handleSearch(e.detail.value!)}
        placeholder="Search"
        debounce={300}
      />

      {/* Updated Filters */}
      <div className="px-4 py-2">
        <div className="flex flex-col gap-2">
          {/* Date Range Picker */}
          <div className="flex gap-1">
            <IonItem className="flex-1">
              <IonLabel position="stacked">Từ ngày</IonLabel>
              <DatePicker
                value={timeFilter.startDate}
                onChange={(e) =>
                  handleTimeFilterChange("startDate", e.detail.value!)
                }
                extraClassName="pb-2"
                attrs={{ id: "startDate" }}
                presentation="date"
              />
            </IonItem>
            <IonItem className="flex-1">
              <IonLabel position="stacked">Đến ngày</IonLabel>
              <DatePicker
                value={timeFilter.endDate}
                onChange={(e) =>
                  handleTimeFilterChange("endDate", e.detail.value!)
                }
                extraClassName="pb-2"
                attrs={{ id: "endDate" }}
                presentation="date"
              />
            </IonItem>
          </div>

          {/* Status Filter */}
          <IonItem>
            <IonLabel position="stacked">Trạng thái</IonLabel>
            <IonSelect
              value={statusFilter}
              placeholder="Chọn trạng thái"
              onIonChange={(e) => handleStatusFilterChange(e.detail.value)}
              className="w-full"
            >
              <IonSelectOption value="">Tất cả</IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.PENDING}>
                Cần xử lý
              </IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.PROCESSING}>
                Đang xử lý
              </IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.BALANCING_REQUIRED}>
                Cần cân đối
              </IonSelectOption>
              <IonSelectOption value={RECEIPT_CHECK_STATUS.BALANCED}>
                Đã cân đối
              </IonSelectOption>
            </IonSelect>
          </IonItem>
        </div>
      </div>

      {/* Content */}
      <IonList>
        <IonListHeader>
          <IonLabel className="font-semibold">
            Tổng phiếu: {pagination.totalItems}
          </IonLabel>
        </IonListHeader>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <IonSpinner name="crescent" />
          </div>
        ) : (
          receipts.map((receipt) => (
            <ItemList key={receipt.id} receipt={receipt} />
          ))
        )}

        {receipts.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-4">
            <p>Không tìm thấy kết quả</p>
          </div>
        )}
      </IonList>

      <IonInfiniteScroll
        threshold="100px"
        disabled={!pagination.hasNext}
        onIonInfinite={handleInfiniteScroll}
      >
        <IonInfiniteScrollContent
          loadingSpinner="crescent"
          loadingText="Đang tải thêm..."
        >
          {isLoading && (
            <div className="flex justify-center p-4">
              <IonSpinner name="crescent" />
            </div>
          )}
        </IonInfiniteScrollContent>
      </IonInfiniteScroll>
    </>
  );
};

export default ReceiptCheckScreen;
