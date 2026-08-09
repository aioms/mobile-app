import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IonContent,
  IonButton,
  IonButtons,
  IonMenuButton,
  IonIcon,
  useIonViewWillEnter,
  IonLabel,
  IonText,
  IonChip,
  useIonModal,
  IonList,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  RefresherEventDetail,
  useIonToast,
} from "@ionic/react";
import {
  addOutline,
  scanOutline,
  close,
  chevronForward,
} from "ionicons/icons";
import { useHistory } from "react-router-dom";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

import ContentSkeleton from "@/components/Loading/ContentSkeleton";
import ProductCard from "./components/ProductCard";
import CategoriesModal from "./components/CategoriesModal";
import FilterModal, { FilterValues } from "./components/FilterModal";
import BarcodeModal from "../ProductDetail/components/BarcodeModal";
import { Refresher } from "@/components/Refresher/Refresher";
import { AppSearchBar, AppFAB, AppCard, AppButton } from "@/components/UI";
import { UserRole } from "@/common/enums/user";

import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import useProduct from "@/hooks/apis/useProduct";
import { useAuth, useBarcodeScanner } from "@/hooks";

import "./ProductList.css";

import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import { IProduct } from "@/types";

interface Total {
  totalProduct: number;
  totalInventory: number;
}

interface LowStockProduct {
  id: string;
  code: string;
  productCode: string;
  productName: string;
  costPrice: number;
  costPriceVatRate?: number | null;
  sellingPrice: number;
  inventory: number;
  unit: string;
  imageUrls?: string[]; // Add imageUrls array property
}

const LIMIT = 10;

const ProductListScreen: React.FC = () => {
  const history = useHistory();
  const { user } = useAuth();

  const [presentToast] = useIonToast();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dataTotal, setDataTotal] = useState<Total>({
    totalProduct: 0,
    totalInventory: 0,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const productsRequestIdRef = useRef(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    categories: [],
    suppliers: [],
    status: "",
    priceRange: { min: null, max: null },
  });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>(
    []
  );
  const [lowStockPage, setLowStockPage] = useState(1);
  const [lowStockLoading, setLowStockLoading] = useState(false);
  const [hasMoreLowStock, setHasMoreLowStock] = useState(true);
  
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeMode, setBarcodeMode] = useState<'view' | 'print'>('view');
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  const { getList, getDetail, getTotalProductAndInventory } = useProduct();

  const isShowCostPrice = useMemo(() => {
    const roles = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.MANAGER, UserRole.EMPLOYEE];
    return user?.role ? roles.includes(user.role) : false;
  }, [user?.role])

  const handleBarcodeScanned = async (value: string) => {
    try {
      stopScan();
      const product = await getDetail(value);

      if (!product || !product.id) {
        presentToast({
          message: "Không tìm thấy sản phẩm với mã vạch này",
          duration: 2000,
          position: "top",
          color: "danger",
        });
        return;
      }

      // Navigate to product detail page
      history.push(`/tabs/products/detail/${product.id}`);
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ProductList',
        'BarcodeScanner',
        'handleBarcodeScanned'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: async (error: Error) => {
      captureException(error as Error, createExceptionContext(
        'ProductList',
        'BarcodeScanner',
        'onError'
      ));

      await presentToast({
        message: error.message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    },
  });

  const fetchProducts = async (
    pageNumber: number = 1,
    isLoadMore: boolean = false
  ) => {
    const requestId = ++productsRequestIdRef.current;
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      setIsLoadingMore(false);
    }

    try {
      const response = await getList(filters, pageNumber, LIMIT);

      if (requestId !== productsRequestIdRef.current) return;

      if (!response.length) {
        if (!isLoadMore) {
          setProducts([]);
          presentToast({
            message: "Không tìm thấy kết quả",
            duration: 2000,
            position: "top",
          });
        }

        setHasMore(false);
      } else {
        setProducts((prev) =>
          isLoadMore ? [...prev, ...response] : response
        );
        setHasMore(response.length === LIMIT);
      }
    } catch (error) {
      if (requestId !== productsRequestIdRef.current) return;

      captureException(error as Error, createExceptionContext(
        'ProductList',
        'ProductList',
        'fetchProducts'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      if (requestId === productsRequestIdRef.current) {
        isLoadMore ? setIsLoadingMore(false) : setIsLoading(false);
      }
    }
  };

  const fetchTotalProductAndInventory = async () => {
    try {
      const response = await getTotalProductAndInventory();
      setDataTotal(response);
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ProductList',
        'ProductList',
        'fetchTotalProductAndInventory'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [filters]);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, keyword: searchText }));
  }, [searchText]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      // Reset page and fetch fresh data
      setPage(1);
      await Promise.all([
        fetchProducts(1, false),
        fetchTotalProductAndInventory(),
        fetchLowStockProducts(1, false)
      ]);
    } finally {
      event.detail.complete();
    }
  };

  useIonViewWillEnter(() => {
    fetchTotalProductAndInventory();
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  const fetchLowStockProducts = async (
    pageNumber: number = 1,
    isLoadMore: boolean = false
  ) => {
    try {
      setLowStockLoading(true);
      const response = await getList({ maxInventory: 1 }, pageNumber, 5);

      if (!response.length) {
        setHasMoreLowStock(false);
      } else {
        setLowStockProducts((prev) =>
          isLoadMore ? [...prev, ...response] : response
        );
        setHasMoreLowStock(response.length === 5);
      }
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ProductList',
        'ProductList',
        'fetchLowStockProducts'
      ));

      presentToast({
        message: (error as Error).message || "Có lỗi xảy ra",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      setLowStockLoading(false);
    }
  };

  const handleLoadMoreLowStock = () => {
    const nextPage = lowStockPage + 1;
    setLowStockPage(nextPage);
    fetchLowStockProducts(nextPage, true);
  };

  useEffect(() => {
    fetchLowStockProducts();
  }, []);

  const [presentCategories, dismissCategories] = useIonModal(CategoriesModal, {
    dismiss: (data: string[], role: string) => dismissCategories(data, role),
    selectedCategories,
  });

  const openCategoriesModal = () => {
    presentCategories({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;
          setSelectedCategories(data);
          setFilters((prev) => ({ ...prev, categories: data }));
        }
      },
    });
  };

  const [presentFilter, dismissFilter] = useIonModal(FilterModal, {
    dismiss: (data: FilterValues, role: string) => dismissFilter(data, role),
    initialFilters: filterValues,
  });

  const openFilterModal = () => {
    presentFilter({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const newFilters = ev.detail.data;
          setFilterValues(newFilters);

          // Update filters for API call
          setFilters({
            suppliers: newFilters.suppliers?.map(
              (s: string) => s.split("__")[0]
            ),
            status: newFilters.status,
            minPrice: newFilters.priceRange.min,
            maxPrice: newFilters.priceRange.max,
          });
        }
      },
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle className="text-center">Danh sách sản phẩm</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <Refresher onRefresh={handleRefresh} />

        <div className="-mx-4 -mt-4 mb-3">
          <AppSearchBar
            searchText={searchText}
            setSearchText={setSearchText}
            placeholder="Tìm kiếm sản phẩm"
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

        <AppCard className="mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1">Tổng sản phẩm</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrencyWithoutSymbol(dataTotal.totalProduct)}
              </span>
            </div>
            <div className="flex flex-col pl-4 border-l border-gray-100">
              <span className="text-xs text-gray-500 mb-1">Tổng tồn kho</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrencyWithoutSymbol(dataTotal.totalInventory)}
              </span>
            </div>
          </div>
        </AppCard>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-2">
              <IonText>
                <h3 className="text-md font-medium">Nhóm hàng</h3>
              </IonText>
              <IonButton
                fill="clear"
                size="small"
                onClick={openCategoriesModal}
                className="text-primary"
              >
                Tất cả
                <IonIcon slot="end" icon={chevronForward} />
              </IonButton>
            </div>

            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              <div className="flex gap-2 flex-nowrap">
                {selectedCategories.map((category) => (
                  <IonChip
                    key={category}
                    className="whitespace-nowrap"
                    color="secondary"
                  >
                    <IonLabel>{category}</IonLabel>
                    <IonIcon
                      icon={close}
                      onClick={() => {
                        setSelectedCategories((prev) =>
                          prev.filter((c) => c !== category)
                        );

                        setFilters((prev) => {
                          const newFilters: any = { ...prev };

                          if (newFilters.categories) {
                            newFilters.categories =
                              newFilters.categories.filter(
                                (c: string) => c !== category
                              );
                          }

                          return newFilters;
                        });
                      }}
                    />
                  </IonChip>
                ))}
              </div>
            </div>
          </div>

          <h3 className="text-md font-medium mb-4">Sản phẩm</h3>
          <IonList className="space-y-2 bg-transparent" style={{ background: 'transparent' }}>
            {isLoading ? (
              <ContentSkeleton lines={3} />
            ) : products.length ? (
              products.map((product) => (
                <ProductCard 
                  key={`product-${product.id}`} 
                  product={product} 
                  isShowCostPrice={isShowCostPrice}
                  onQuickBarcode={() => {
                    setSelectedProduct(product);
                    setBarcodeMode('view');
                    setShowBarcodeModal(true);
                  }}
                  onPrintBarcode={() => {
                    setSelectedProduct(product);
                    setBarcodeMode('print');
                    setShowBarcodeModal(true);
                  }}
                />
              ))
            ) : null}

            {!isLoading && !hasMore && products.length === 0 && (
              <div className="text-center text-gray-500">
                <i className="text-sm"> Không tìm thấy sản phẩm nào</i>
              </div>
            )}
          </IonList>
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center my-4">
              <AppButton
                variant="pill"
                onClick={handleLoadMore}
                loading={isLoading || isLoadingMore}
                loadingText="Đang tải..."
              >
                Xem thêm
              </AppButton>
            </div>
          )}

          {/* Low Stock Products Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Sản phẩm sắp hết hàng</h3>
              {hasMoreLowStock && (
                <AppButton
                  variant="clear"
                  size="small"
                  onClick={handleLoadMoreLowStock}
                  loading={lowStockLoading}
                >
                  Xem thêm
                </AppButton>
              )}
            </div>

            {lowStockProducts.length > 0 ? (
              <Swiper
                modules={[Pagination]}
                spaceBetween={16}
                slidesPerView={1}
                pagination={{
                  clickable: true,
                  bulletClass:
                    "swiper-pagination-bullet swiper-pagination-bullet-custom",
                  bulletActiveClass:
                    "swiper-pagination-bullet-active swiper-pagination-bullet-active-custom",
                  renderBullet: (_index, className) => {
                    return `<span class="${className}"></span>`;
                  },
                }}
                className="low-stock-swiper"
              >
                {lowStockProducts.map((product) => {
                  // Get the first image URL or use fallback
                  const primaryImageUrl =
                    product.imageUrls && product.imageUrls.length > 0
                      ? product.imageUrls[0]
                      : null;

                  return (
                    <SwiperSlide key={`lowstock-${product.id}`} className="pb-2">
                      <div className="low-stock-card bg-white rounded-2xl p-3 sm:p-4 flex flex-wrap items-start sm:flex-nowrap sm:items-center gap-3 shadow-sm border border-gray-100 mx-1">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {primaryImageUrl ? (
                            <img
                              src={primaryImageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                target.parentElement!.innerHTML =
                                  '<ion-icon name="add-outline" class="text-gray-400 text-2xl"></ion-icon>';
                              }}
                            />
                          ) : (
                            <IonIcon
                              icon={addOutline}
                              className="text-gray-400 text-2xl"
                            />
                          )}
                        </div>
                        <div className="low-stock-product-details flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 break-words">{product.productName}</h4>
                          <p className="text-sm text-gray-500">
                            {product.code}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <p className="text-sm">
                              Tồn: {product.inventory} {product.unit}
                            </p>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {isShowCostPrice ? (
                              <div>
                                <div className="flex items-center gap-1">
                                  <p className="text-xs text-gray-500">Giá vốn</p>
                                  {product.costPriceVatRate !== null &&
                                  product.costPriceVatRate !== undefined ? (
                                    <span className="text-[10px] text-blue-600 font-medium">
                                      VAT {product.costPriceVatRate}%
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-sm font-medium">
                                  {formatCurrencyWithoutSymbol(product.costPrice)}
                                </p>
                              </div>
                            ) : null}
                            <div>
                              <p className="text-xs text-gray-500 text-nowrap">Giá sỉ</p>
                              <p className="text-sm font-medium">
                                {formatCurrencyWithoutSymbol(
                                  product.sellingPrice
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 text-nowrap">Giá lẻ</p>
                              <p className="text-sm font-medium">
                                {formatCurrencyWithoutSymbol(
                                  (product as any).retailPrice || 0
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <IonButton
                          fill="solid"
                          size="small"
                          className="low-stock-import-button bg-blue-600 rounded text-white flex-shrink-0"
                          routerLink="/tabs/receipt-import/create"
                        >
                          Nhập thêm
                        </IonButton>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <i className="text-sm">Không có sản phẩm sắp hết hàng</i>
              </div>
            )}
          </div>
      </IonContent>

      <AppFAB onClick={() => history.push("/tabs/products/create")} />

      {selectedProduct && (
        <BarcodeModal
          isOpen={showBarcodeModal}
          onDidDismiss={() => {
            setShowBarcodeModal(false);
            setSelectedProduct(null);
          }}
          productName={selectedProduct.productName}
          productCode={selectedProduct.code}
          mode={barcodeMode}
        />
      )}
    </IonPage>
  );
};

export default ProductListScreen;
