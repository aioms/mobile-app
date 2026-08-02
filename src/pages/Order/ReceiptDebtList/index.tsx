import { FC, useState, useEffect, useMemo } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonButton,
  IonIcon,
  useIonToast,
  RefresherEventDetail,
} from "@ionic/react";
import { AppSearchBar, AppCard, AppButton } from "@/components/UI";
import { scanOutline } from "ionicons/icons";
import { useHistory } from "react-router";

import { useBarcodeScanner, useLoading, useStorage } from "@/hooks";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import useProduct from "@/hooks/apis/useProduct";

import { TReceiptDebtStatus } from "@/common/constants/receipt-debt.constant";
import { capitalizeFirstLetter } from "@/helpers/common";
import { dayjsFormat, formatCurrency, formatCurrencyWithoutSymbol } from "@/helpers/formatters";

import LoadingScreen from "@/components/Loading/LoadingScreen";
import { Refresher } from "@/components/Refresher/Refresher";
import ReceiptDebtItem from "./components/ReceiptDebtItem";
import FilterModal from "./components/FilterModal";

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
  const history = useHistory();
  const [presentToast] = useIonToast();

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
  const { addItem, getItem } = useStorage();
  const { getList, getStatistics } = useReceiptDebt();

  const { getDetail: getProductDetail } = useProduct();

  const [statistics, setStatistics] = useState<{
    totalCount: number;
    totalOutstandingAmount: number;
  }>({
    totalCount: 0,
    totalOutstandingAmount: 0,
  });

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter((val) => val !== "").length;
  }, [filters]);

  const openFilterModal = () => setIsFilterModalOpen(true);

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: (error: Error) => {
      presentToast({
        message: error.message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    },
  });

  /**
   * Handles the result of a scanned barcode by adding the corresponding product to a draft receipt or creating a new draft.
   *
   * If the scanned product is not found or is out of stock, displays a toast notification. If a draft receipt exists, increments the quantity of the product if already present, or adds it as a new item. If no draft exists, creates a new draft receipt with the scanned product. Navigates to the receipt creation page upon success.
   *
   * @param value - The scanned barcode value
   */
  async function handleBarcodeScanned(value: string) {
    stopScan();

    try {
      const result = await getProductDetail(value);

      if (!result) {
        return await Toast.show({
          text: `Không tìm thấy sản phẩm với mã vạch ${value}`,
          duration: "short",
          position: "center",
        });
      }

      if (result.inventory === 0) {
        return await Toast.show({
          text: "Sản phẩm này đã hết hàng",
          duration: "short",
          position: "center",
        });
      }

      const draftReceipt = await getItem("debt_draft");

      if (draftReceipt) {
        const existingItem = draftReceipt.items.find(
          (item: { id: string }) => item.id === result.id
        );

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          draftReceipt.items.push({
            id: result.id,
            productName: result.productName,
            productCode: result.productCode,
            code: result.code,
            sellingPrice: result.sellingPrice,
            quantity: 1,
          });
        }

        await addItem("debt_draft", draftReceipt);
      } else {
        await addItem("debt_draft", {
          items: [
            {
              id: result.id,
              productId: result.id,
              productName: result.productName,
              productCode: result.productCode,
              code: result.code,
              sellingPrice: result.sellingPrice,
              quantity: 1,
            },
          ],
        });
      }

      history.push(`/tabs/debt/create`);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  }

  const fetchReceiptDebts = async (
    pageNum: number = 1,
    keyword: string = "",
    appliedFilters: typeof filters = filters
  ) => {
    await withLoading(async () => {
      try {
        const requestFilters: Record<string, string> = {};

        if (keyword) {
          requestFilters.keyword = keyword;
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

        setReceiptDebts((prev) => [...prev, ...(data || [])]);
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

  const fetchStatistics = async () => {
    try {
      const stats = await getStatistics();
      setStatistics(stats);
    } catch (error) {
      await presentToast({
        message: (error as Error).message || "Không thể tải thống kê",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  useEffect(() => {
    setReceiptDebts([]);
    setPage(1);
    fetchReceiptDebts(1, searchKeyword, filters);
    fetchStatistics();
  }, [searchKeyword]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchReceiptDebts(nextPage, searchKeyword, filters);
    }
  };

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setReceiptDebts([]);
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
    setReceiptDebts([]);
    setPage(1);
    fetchReceiptDebts(1, searchKeyword, clearedFilters);
  };

  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setReceiptDebts([]);
    setPage(1);
    Promise.all([fetchReceiptDebts(1, searchKeyword, filters), fetchStatistics()]).finally(() => {
      event.detail.complete();
    });
  };

  return (
    <div className="">
      {isLoading && <LoadingScreen message="Đang tải dữ liệu..." />}
      <Refresher onRefresh={handleRefresh} />

      {/* Debt Count */}
      <AppCard className="mx-4 mb-3">
        <div className="text-xs font-medium text-gray-500 mb-2">
          {capitalizeFirstLetter(
            dayjsFormat(new Date(), "dddd, DD MMMM YYYY", "vi")
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">Tổng số phiếu thu</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrencyWithoutSymbol(totalCount)}
            </span>
          </div>
          <div className="flex flex-col pl-4 border-l border-gray-100">
            <span className="text-xs text-gray-500 mb-1">Tổng công nợ</span>
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(statistics.totalOutstandingAmount)}
            </span>
          </div>
        </div>
      </AppCard>

      {/* Search and Filter */}
      <div className="mb-2">
        <AppSearchBar
          searchText={searchKeyword}
          setSearchText={(val) => {
            setSearchKeyword(val);
            setPage(1);
          }}
          placeholder="Tìm Phiếu Thu..."
          isFiltered={activeFilterCount > 0}
          onFilterClick={openFilterModal}
          extraAction={
            <IonButton
              fill="clear"
              className="h-10 w-10 m-0 flex-shrink-0 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => startScan()}
              style={{
                '--padding-start': '0px',
                '--padding-end': '0px',
                '--padding-top': '0px',
                '--padding-bottom': '0px',
                '--min-height': '40px',
                '--min-width': '40px',
              }}
            >
              <IonIcon icon={scanOutline} slot="icon-only" className="text-xl" />
            </IonButton>
          }
        />
      </div>

      {/* Receipt Debt List */}
      <IonList className="space-y-2 bg-transparent">
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
        <div className="flex justify-center my-3">
          <AppButton
            variant="pill"
            onClick={handleLoadMore}
            loading={isLoading}
            loadingText="Đang tải..."
          >
            Xem thêm
          </AppButton>
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
