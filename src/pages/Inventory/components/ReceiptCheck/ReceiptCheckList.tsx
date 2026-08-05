import { useState, useEffect } from "react";
import {
  IonList,
  IonListHeader,
  IonLabel,
  RefresherEventDetail,
  IonSpinner,
  useIonToast,
} from "@ionic/react";

import useReceiptCheck from "@/hooks/apis/useReceiptCheck";
import { AppButton } from "@/components/UI";

import { TReceiptCheckStatus } from "@/common/constants/receipt-check.constant";
import { Refresher } from "@/components/Refresher/Refresher";
import { ItemList } from "./components/ItemList";
import { FilterSection } from "./components/FilterSection";
import { defaultReceiptCheckFilters, ReceiptCheckFilterValues } from "./components/FilterModal";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";

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



const ReceiptCheckScreen = () => {
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<ReceiptCheckFilterValues>(defaultReceiptCheckFilters);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    hasPrevious: false,
    hasNext: false,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [presentToast] = useIonToast();

  const { getList: getListReceiptCheck } = useReceiptCheck();

  const fetchReceiptChecks = async (
    page: number = 1,
    isLoadMore: boolean = false
  ) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const { data, metadata, success, statusCode } = await getListReceiptCheck(
        {
          keyword: searchText,
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status,
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
      captureException(error as Error, createExceptionContext(
        'Inventory',
        'ReceiptCheckList',
        'fetchReceiptChecks'
      ));
      
      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleInfiniteScroll = async (ev: any) => {
    if (!pagination.hasNext || isLoading || isLoadingMore) {
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

  useEffect(() => {
    fetchReceiptChecks(1);
  }, [filters, searchText]);

  return (
    <>
      <Refresher onRefresh={handleRefresh} />

      <FilterSection
        searchText={searchText}
        setSearchText={handleSearch}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Content */}
      <IonList className="bg-transparent">
        <IonListHeader className="px-4">
          <IonLabel className="font-semibold text-gray-700">
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

      {pagination.hasNext && receipts.length > 0 && (
        <div className="flex justify-center my-3">
          <AppButton
            variant="pill"
            onClick={() => fetchReceiptChecks(pagination.currentPage + 1, true)}
            loading={isLoadingMore}
            loadingText="Đang tải..."
          >
            Xem thêm
          </AppButton>
        </div>
      )}
    </>
  );
};

export default ReceiptCheckScreen;
