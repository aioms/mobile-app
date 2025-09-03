import React, { useEffect, useState } from "react";
import { Toast } from "@capacitor/toast";
import {
  IonContent,
  IonSearchbar,
  IonButtons,
  IonButton,
  IonIcon,
  useIonViewWillEnter,
  IonSpinner,
  IonList,
  IonItem,
  IonBadge,
  IonLabel,
  IonText,
  IonChip,
  useIonModal,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
} from "@ionic/react";
import {
  filterOutline,
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

import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";
import useProduct from "@/hooks/apis/useProduct";
import { useBarcodeScanner, useLoading } from "@/hooks";

import "./ProductList.css";

interface Product {
  id: string;
  code: string;
  productCode: string;
  productName: string;
  inventory: number;
  unit: string;
  status: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
}

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
  sellingPrice: number;
  inventory: number;
  unit: string;
  imageUrls?: string[]; // Add imageUrls array property
}

const LIMIT = 10;

const ProductListScreen: React.FC = () => {
  const history = useHistory();
  const { isLoading, withLoading } = useLoading();

  const [products, setProducts] = useState<Product[]>([]);
  const [dataTotal, setDataTotal] = useState<Total>({
    totalProduct: 0,
    totalInventory: 0,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
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
  const { getList, getDetail, getTotalProductAndInventory } = useProduct();

  const handleBarcodeScanned = async (value: string) => {
    try {
      stopScan();
      const product = await getDetail(value);

      if (!product || !product.id) {
        await Toast.show({
          text: "Không tìm thấy sản phẩm với mã vạch này",
          duration: "short",
          position: "center",
        });
        return;
      }

      // Navigate to product detail page
      history.push(`/tabs/products/${product.id}`);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  const { startScan, stopScan } = useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScanned,
    onError: async (error: Error) => {
      await Toast.show({
        text: error.message,
        duration: "long",
        position: "top",
      });
    },
  });

  const fetchProducts = async (
    pageNumber: number = 1,
    isLoadMore: boolean = false
  ) => {
    await withLoading(async () => {
      try {
        const response = await getList(filters, pageNumber, LIMIT);

        if (!response.length) {
          setProducts([]);
          setHasMore(false);

          if (!isLoadMore) {
            await Toast.show({
              text: "Không tìm thấy kết quả",
              duration: "short",
              position: "top",
            });
          }
        } else {
          setProducts((prev) =>
            isLoadMore ? [...prev, ...response] : response
          );
          setHasMore(response.length === LIMIT);
        }
      } catch (error) {
        await Toast.show({
          text: (error as Error).message,
          duration: "short",
          position: "top",
        });
      }
    });
  };

  const fetchTotalProductAndInventory = async () => {
    try {
      const response = await getTotalProductAndInventory();
      setDataTotal(response);
    } catch (error) {
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
      });
    }
  };

  useEffect(() => {
    setPage(1);
    fetchProducts(1);
  }, [filters]);

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
      await Toast.show({
        text: (error as Error).message,
        duration: "short",
        position: "top",
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
          <IonTitle>Danh sách sản phẩm</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="">
          <div className="flex items-center gap-2 mb-2">
            <IonSearchbar
              value={filters.keyword}
              onIonChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  keyword: e.detail.value ?? "",
                }));
              }}
              placeholder="Tìm kiếm sản phẩm"
              className="flex-1 bg-gray-100 rounded-lg p-0 h-[40px]"
              debounce={300}
              enterkeyhint="search"
              inputmode="search"
            />
            <IonButtons slot="end">
              <IonButton fill="clear" color="primary" onClick={openFilterModal}>
                <IonIcon icon={filterOutline} size="icon-only" />
              </IonButton>
              <IonButton color="primary" onClick={() => startScan()}>
                <IonIcon icon={scanOutline} slot="icon-only" />
              </IonButton>
            </IonButtons>
          </div>

          <div className="mb-3 bg-white rounded-lg shadow-md p-4">
            <IonList>
              <IonItem>
                <IonBadge slot="end">
                  {formatCurrencyWithoutSymbol(dataTotal.totalProduct)}
                </IonBadge>
                <IonLabel>Tổng sản phẩm</IonLabel>
              </IonItem>
              <IonItem>
                <IonBadge slot="end">
                  {formatCurrencyWithoutSymbol(dataTotal.totalInventory)}
                </IonBadge>
                <IonLabel>Tổng tồn kho</IonLabel>
              </IonItem>
            </IonList>
          </div>

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
          <div className="space-y-4">
            {products.length ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <ContentSkeleton lines={3} />
            )}

            {!hasMore && products.length === 0 && (
              <div className="text-center text-gray-500">
                <i className="text-sm"> Không tìm thấy sản phẩm nào</i>
              </div>
            )}
          </div>
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mb-6">
              <IonButton
                fill="clear"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? <IonSpinner name="crescent" /> : "Xem thêm"}
              </IonButton>
            </div>
          )}

          {/* Low Stock Products Section */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium">Sản phẩm sắp hết hàng</h3>
              {hasMoreLowStock && (
                <IonButton
                  fill="clear"
                  size="small"
                  onClick={handleLoadMoreLowStock}
                  disabled={lowStockLoading}
                >
                  {lowStockLoading ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    "Xem thêm"
                  )}
                </IonButton>
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
                    <SwiperSlide key={product.id}>
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center mr-4 overflow-hidden">
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
                        <div className="flex-1">
                          <h4 className="font-medium">{product.productName}</h4>
                          <p className="text-sm text-gray-500">{product.code}</p>
                          <div className="flex gap-2 mt-1">
                            <p className="text-sm">
                              Tồn: {product.inventory} {product.unit}
                            </p>
                          </div>
                          <div className="flex justify-between mt-1">
                            <div>
                              <p className="text-xs text-gray-500">Giá vốn</p>
                              <p className="text-sm font-medium">
                                {formatCurrencyWithoutSymbol(product.costPrice)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Giá bán</p>
                              <p className="text-sm font-medium">
                                {formatCurrencyWithoutSymbol(
                                  product.sellingPrice
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <IonButton
                          fill="solid"
                          size="small"
                          className="bg-blue-600 rounded text-white"
                          routerLink="/tabs/receipt-import/create"
                        >
                          Nhập thêm
                        </IonButton>
                      </div>
                    </SwiperSlide>
                  );
                })
                }
              </Swiper>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <i className="text-sm">Không có sản phẩm sắp hết hàng</i>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProductListScreen;
