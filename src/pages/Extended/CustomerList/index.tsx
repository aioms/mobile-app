import { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonSpinner,
  IonFab,
  IonFabButton,
} from "@ionic/react";
import { ellipsisVertical, personAdd } from "ionicons/icons";
import { debounce } from "radash";
import useCustomer from "@/hooks/apis/useCustomer";
import ModalSelectCustomer from "@/components/ModalSelectCustomer";
import FilterSection from "./components/FilterSection";
import CustomerItem from "./components/CustomerItem";

import { ICustomer, ICustomerFilters } from "./types";

const CustomerList: React.FC = () => {
  const history = useHistory();
  const [customers, setCustomers] = useState<ICustomer[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { getListV2 } = useCustomer();

  const loadCustomers = async (currentPage = 1, isRefresh = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const filters: ICustomerFilters = {
        keyword: searchKeyword,
        ...(status !== "all" && { status: Number(status) }),
        ...(type !== "all" && { type: Number(type) }),
        ...(selectedCustomerIds.length > 0 && { customerIds: selectedCustomerIds }),
      };

      const response = await getListV2(filters, currentPage, 15);

      // Handle the new response structure { data: [], metadata: {}, success: true, statusCode: 200 }
      const fetchedCustomers = response?.data || [];
      const metadata = response?.metadata || { totalCount: 0, totalPages: 0 };

      if (isRefresh) {
        setCustomers(fetchedCustomers);
      } else {
        setCustomers((prev) => [...prev, ...fetchedCustomers]);
      }

      setTotal(metadata.totalCount || customers.length + fetchedCustomers.length);

      // Determination of hasMore based on metadata or fallback to length
      if (metadata.totalPages) {
        setHasMore(currentPage < metadata.totalPages);
      } else {
        setHasMore(fetchedCustomers.length === 15);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search update
  const debouncedSetKeyword = useMemo(
    () => debounce({ delay: 500 }, (val: string) => setSearchKeyword(val)),
    []
  );

  useEffect(() => {
    debouncedSetKeyword(searchText);
  }, [searchText, debouncedSetKeyword]);

  useEffect(() => {
    loadCustomers(1, true);
    setPage(1);
  }, [searchKeyword, status, type, selectedCustomerIds]);

  const loadMore = async (e: any) => {
    if (!hasMore) {
      e.target.complete();
      return;
    }
    const nextPage = page + 1;
    await loadCustomers(nextPage, false);
    setPage(nextPage);
    e.target.complete();
  };

  const handleFilterDismiss = (data?: any, role?: string) => {
    setShowFilterModal(false);
    if (role === "confirm" && data) {
      const ids = Array.isArray(data) ? data.map((v: string) => v.split("__")[0]) : [];
      setSelectedCustomerIds(ids);
    }
  };

  const handleClearFilters = () => {
    setSearchText("");
    setStatus("all");
    setType("all");
    setSelectedCustomerIds([]);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended" color="dark" />
          </IonButtons>
          {/* Centered title */}
          <div className="flex justify-center flex-1 w-full absolute inset-0 items-center pointer-events-none">
            <IonTitle className="text-center font-bold text-gray-900 text-[17px]">Tất cả khách hàng</IonTitle>
          </div>
          <IonButtons slot="end">
            <IonButton color="dark">
              <IonIcon icon={ellipsisVertical} />
            </IonButton>
          </IonButtons>
        </IonToolbar>

        <FilterSection
          searchText={searchText}
          setSearchText={setSearchText}
          status={status}
          setStatus={setStatus}
          type={type}
          setType={setType}
          isFiltered={selectedCustomerIds.length > 0 || searchText !== "" || status !== "all" || type !== "all"}
          onClearFilters={handleClearFilters}
          onFilterClick={() => setShowFilterModal(true)}
        />
      </IonHeader>

      <IonContent className="bg-white">
        {loading && page === 1 ? (
          <div className="flex justify-center mt-10">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div className="pb-24 pt-2">
            <div>
              <h3 className="px-4 text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                Danh sách khách hàng ({customers.length})
              </h3>
              {customers.length === 0 ? (
                <div className="text-center mt-10 px-6 text-gray-500">
                  <p className="text-sm">Không tìm thấy khách hàng.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {customers.map((customer) => (
                    <CustomerItem
                      key={customer.id}
                      customer={customer}
                      onClick={() => history.push(`/tabs/extended/customers/detail/${customer.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <IonInfiniteScroll onIonInfinite={loadMore} disabled={!hasMore}>
          <IonInfiniteScrollContent loadingSpinner="bubbles" loadingText="Đang tải thêm..." />
        </IonInfiniteScroll>

        <IonFab vertical="bottom" horizontal="end" slot="fixed" className="mb-4 mr-4 shadow-lg rounded-full">
          <IonFabButton color="primary" className="w-[52px] h-[52px]">
            <IonIcon icon={personAdd} className="text-white text-2xl" />
          </IonFabButton>
        </IonFab>

        {showFilterModal && (
          <ModalSelectCustomer
            dismiss={handleFilterDismiss}
            multiple={true}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default CustomerList;
