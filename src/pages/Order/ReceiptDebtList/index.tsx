import { FC, useState, useEffect } from "react";
import {
  IonList,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonIcon,
  useIonToast,
} from "@ionic/react";
import { funnel } from "ionicons/icons";

import { TReceiptDebtStatus } from "@/common/constants/receipt";
import ReceiptDebtItem from "./components/ReceiptDebtItem";
import FilterModal from "./components/FilterModal";
import { useLoading } from "@/hooks";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import { Toast } from "@capacitor/toast";

interface ReceiptDebt {
  id: string;
  code: string;
  dueDate: string;
  customerName: string;
  remainingAmount: number;
  status: TReceiptDebtStatus;
}

const LIMIT = 10;

const ReceiptDebtList: FC = () => {
  const [receiptDebts, setReceiptDebts] = useState<ReceiptDebt[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    customerId: "",
    dueDate: "",
    createdDate: "",
    status: "",
  });
  const { isLoading, withLoading } = useLoading();

  const [presentToast] = useIonToast();
  const { getList } = useReceiptDebt();

  const fetchReceiptDebts = async (
    pageNum: number = 1,
    keyword: string = "",
    appliedFilters: typeof filters = filters
  ) => {
    await withLoading(async () => {
      try {
        const requestFilters: Record<string, string> = {};

        if (keyword) {
          requestFilters.search = keyword;
        }
        if (appliedFilters.customerId) {
          requestFilters.customerId = appliedFilters.customerId;
        }
        if (appliedFilters.dueDate) {
          requestFilters.dueDate = appliedFilters.dueDate;
        }
        if (appliedFilters.createdDate) {
          requestFilters.createdDate = appliedFilters.createdDate;
        }
        if (appliedFilters.status) {
          requestFilters.status = appliedFilters.status;
        }

        const { data, metadata } = await getList(
          requestFilters,
          pageNum,
          LIMIT
        );

        if (!data || !data.length) {
          Toast.show({
            text: "Không tìm thấy phiếu thu",
            duration: "short",
            position: "top",
          });
        }

        setReceiptDebts(data || []);
        setTotalCount(metadata?.totalItems || 0);
        setHasMore(metadata?.hasNext || false);
      } catch (error) {
        await presentToast({
          message: (error as Error).message || "Có lỗi xảy ra",
          duration: 2000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  useEffect(() => {
    fetchReceiptDebts(1, searchKeyword, filters);
  }, [searchKeyword]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReceiptDebts(nextPage, searchKeyword, filters);
    }
  };

  const handleSearch = (e: any) => {
    const keyword = e.detail.value || "";
    setSearchKeyword(keyword);
    setPage(1);
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    setIsFilterModalOpen(false);
    fetchReceiptDebts(1, searchKeyword, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      customerId: "",
      dueDate: "",
      createdDate: "",
      status: "",
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchReceiptDebts(1, searchKeyword, clearedFilters);
  };

  return (
    <div className="">
      {/* Search and Filter */}
      <div className="flex items-center space-x-2">
        <IonSearchbar
          placeholder="Tìm Phiếu Thu"
          onIonInput={handleSearch}
          className="flex-1"
          debounce={500}
        />
        <IonButton
          fill="outline"
          size="default"
          className="flex-shrink-0"
          onClick={() => setIsFilterModalOpen(true)}
        >
          <IonIcon icon={funnel} slot="icon-only" />
        </IonButton>
      </div>

      {/* {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
      <Refresher onRefresh={handleRefresh} /> */}

      {/* Order Count */}
      <div className="flex justify-between items-center bg-card rounded-lg shadow-sm mb-2 p-4">
        <div className="flex flex-col">
          <h2 className="text-lg font-medium">
            Tổng số phiếu thu: {totalCount}
          </h2>
        </div>
      </div>

      {/* Receipt Debt List */}
      <IonList className="space-y-2">
        {receiptDebts.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <div className="text-center">
              <p className="text-lg font-medium">Không tìm thấy phiếu thu</p>
            </div>
          </div>
        ) : (
          receiptDebts.map((receiptDebt) => (
            <ReceiptDebtItem key={receiptDebt.id} receiptDebt={receiptDebt} />
          ))
        )}
      </IonList>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mt-3">
          <IonButton
            fill="clear"
            onClick={handleLoadMore}
            disabled={isLoading}
            className="w-full max-w-xs"
          >
            {isLoading ? <IonSpinner name="crescent" /> : "Xem thêm"}
          </IonButton>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />
    </div>
  );
};

export default ReceiptDebtList;
