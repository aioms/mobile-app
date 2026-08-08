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
  IonIcon,
  IonSpinner,
  IonChip,
} from "@ionic/react";
import { closeCircle } from "ionicons/icons";
import { debounce } from "radash";
import useSupplier from "@/hooks/apis/useSupplier";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import SupplierCard from "./components/SupplierCard";
import { AppSearchBar, AppFAB, AppButton } from "@/components/UI";
import { ISupplierFilters } from "./types";
import { ISupplier } from "@/types/supplier";

const SupplierList: React.FC = () => {
  const history = useHistory();
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { getList } = useSupplier();

  const loadSuppliers = async (currentPage = 1, isRefresh = false) => {
    try {
      if (currentPage === 1) setLoading(true);

      const filters: ISupplierFilters = {
        keyword: searchKeyword,
        ...(selectedSuppliers.length > 0 && { supplierIds: selectedSuppliers.map(s => s.split("__")[0]) }),
      };

      // Transform filters for the API
      const apiFilters: Record<string, string> = {};
      if (filters.keyword) apiFilters.keyword = filters.keyword;
      if (filters.type) apiFilters.type = filters.type;
      if (filters.supplierIds) apiFilters.supplierIds = filters.supplierIds.join(",");

      const response = await getList(apiFilters, currentPage, 15);

      // Adaptation to match API response structure
      const fetchedSuppliers = response?.data || [];
      const metadata = response?.metadata || { totalCount: 0, totalPages: 0 };

      if (isRefresh) {
        setSuppliers(fetchedSuppliers);
      } else {
        setSuppliers((prev) => [...prev, ...fetchedSuppliers]);
      }

      if (metadata.totalPages) {
        setHasMore(currentPage < metadata.totalPages);
      } else {
        setHasMore(fetchedSuppliers.length === 15);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSetKeyword = useMemo(
    () => debounce({ delay: 500 }, (val: string) => setSearchKeyword(val)),
    []
  );

  useEffect(() => {
    debouncedSetKeyword(searchText);
  }, [searchText, debouncedSetKeyword]);

  useEffect(() => {
    loadSuppliers(1, true);
    setPage(1);
  }, [searchKeyword, selectedSuppliers]);

  const loadMore = async (e: any) => {
    if (!hasMore) {
      e.target.complete();
      return;
    }
    const nextPage = page + 1;
    await loadSuppliers(nextPage, false);
    setPage(nextPage);
    e.target.complete();
  };

  const handleFilterDismiss = (data?: any, role?: string) => {
    setShowFilterModal(false);
    if (role === "confirm" && data) {
      const tokens = Array.isArray(data) ? data : [];
      setSelectedSuppliers(tokens);
    }
  };

  const removeSupplierFilter = (token: string) => {
    setSelectedSuppliers((prev) => prev.filter((t) => t !== token));
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar className="bg-white">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/extended" color="dark" />
          </IonButtons>
          <div className="flex justify-center flex-1 w-full absolute inset-0 items-center pointer-events-none">
            <IonTitle className="text-center font-bold text-gray-900 text-[17px]">Nhà cung cấp</IonTitle>
          </div>
          {/* <IonButtons slot="end">
            <IonButton
              className="bg-primary text-white rounded-lg h-9 px-3 text-[13px] font-medium normal-case"
              onClick={() => history.push("/tabs/extended/suppliers/create")}
            >
              <IonIcon icon={addOutline} slot="start" className="text-lg mr-1" />
              Thêm NCC
            </IonButton>
          </IonButtons> */}
        </IonToolbar>

        <AppSearchBar
          searchText={searchText}
          setSearchText={setSearchText}
          placeholder="Tìm NCC theo tên, danh mục..."
          isFiltered={selectedSuppliers.length > 0 || searchText !== ""}
          onFilterClick={() => setShowFilterModal(true)}
          debounceMs={0}
        />
        {selectedSuppliers.length > 0 && (
          <div className="px-4 pb-2 bg-white flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {selectedSuppliers.map((token) => {
              const [id, name] = token.split("__");
              return (
                <IonChip key={id} className="m-0 bg-primary/10 text-primary text-[12px] h-8">
                  <span className="font-medium">{name}</span>
                  <IonIcon
                    icon={closeCircle}
                    onClick={() => removeSupplierFilter(token)}
                    className="text-primary opacity-70 ml-1"
                  />
                </IonChip>
              );
            })}
          </div>
        )}
      </IonHeader>

      <IonContent className="bg-[#F8F9FB]">
        {loading && page === 1 ? (
          <div className="flex justify-center mt-10">
            <IonSpinner name="crescent" color="primary" />
          </div>
        ) : (
          <div className="px-4 py-4">
            {suppliers.length === 0 ? (
              <div className="text-center mt-10 px-6 text-gray-500">
                <p className="text-sm">Không tìm thấy nhà cung cấp.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col">
                  {suppliers.map((supplier) => (
                    <SupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      onClick={() => history.push(`/tabs/extended/suppliers/detail/${supplier.id}`)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center my-3">
                    <AppButton
                      variant="pill"
                      onClick={async () => {
                        const nextPage = page + 1;
                        await loadSuppliers(nextPage, false);
                        setPage(nextPage);
                      }}
                      loading={loading && page > 1}
                      loadingText="Đang tải..."
                    >
                      Xem thêm
                    </AppButton>
                  </div>
                )}
              </>
            )}
            <div className="pb-20" />
          </div>
        )}

        {showFilterModal && (
          <ModalSelectSupplier
            dismiss={handleFilterDismiss}
            multi={true}
          />
        )}
        
        <AppFAB onClick={() => history.push("/tabs/extended/suppliers/create")} />
      </IonContent>
    </IonPage>
  );
};

export default SupplierList;
