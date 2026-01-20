import { FC, useState, useEffect } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonList,
  IonButton,
  IonSearchbar,
  IonSpinner,
  IonIcon,
  useIonToast,
  IonRippleEffect,
  IonItem,
  IonBadge,
  IonLabel,
  RefresherEventDetail,
} from "@ionic/react";
import { funnelOutline, scanOutline } from "ionicons/icons";
import { useHistory } from "react-router";

import { useBarcodeScanner, useLoading, useStorage } from "@/hooks";
import useReceiptDebt from "@/hooks/apis/useReceiptDebt";
import useProduct from "@/hooks/apis/useProduct";

import { TReceiptDebtStatus } from "@/common/constants/receipt-debt.constant";
import { capitalizeFirstLetter } from "@/helpers/common";
import { dayjsFormat, formatCurrencyWithoutSymbol } from "@/helpers/formatters";

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

  const handleSearch = (e: any) => {
    const keyword = e.detail.value || "";
    setSearchKeyword(keyword);
    setPage(1);
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

      {/* Order Count */}
      <div className="mb-3 bg-white rounded-lg shadow-sm p-2">
        <IonList>
          <IonItem>
            <div className="date-display">
              {capitalizeFirstLetter(
                dayjsFormat(new Date(), "dddd, DD MMMM YYYY", "vi")
              )}
            </div>
          </IonItem>
          <IonItem>
            <IonBadge slot="end">
              {formatCurrencyWithoutSymbol(totalCount)}
            </IonBadge>
            <IonLabel>Tổng số phiếu thu</IonLabel>
          </IonItem>
          <IonItem>
            <IonBadge slot="end" color="danger">
              {formatCurrencyWithoutSymbol(statistics.totalOutstandingAmount)}
            </IonBadge>
            <IonLabel>Tổng công nợ</IonLabel>
          </IonItem>
        </IonList>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center mb-2">
        <IonSearchbar
          placeholder="Tìm Phiếu Thu"
          onIonInput={handleSearch}
          className="flex-1"
          debounce={500}
        />
        <div className="flex-shrink-0 flex items-center justify-center space-x-1">
          <IonButton
            fill="clear"
            size="default"
            className="w-10 h-10 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 ion-activatable ripple-parent"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <IonIcon
              icon={funnelOutline}
              slot="icon-only"
              className="text-2xl text-gray-400"
            />
            <IonRippleEffect></IonRippleEffect>
          </IonButton>
          <div
            className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center ion-activatable ripple-parent"
            onClick={() => startScan()}
          >
            <IonIcon icon={scanOutline} className="text-3xl text-teal-400" />
            <IonRippleEffect></IonRippleEffect>
          </div>
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
