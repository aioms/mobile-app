import React, { useState, useEffect } from "react";
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonPage,
  useIonModal,
} from "@ionic/react";
import { close, chevronForward, storefrontOutline, filterOutline } from "ionicons/icons";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import { PRODUCT_STATUS } from "@/common/constants/product";
import { formatCurrencyWithoutSymbol } from "@/helpers/formatters";

export interface FilterValues {
  categories: string[];
  suppliers: string[];
  status: string;
  priceRange: {
    min: number | null;
    max: number | null;
  };
}

interface Supplier {
  id: string;
  name: string;
}

interface Props {
  dismiss: (data?: FilterValues, role?: string) => void;
  initialFilters: FilterValues;
}

export const defaultProductFilters: FilterValues = {
  categories: [],
  suppliers: [],
  status: "",
  priceRange: { min: null, max: null },
};

// Helper to format currency display strings (e.g. 100000 -> "100.000")
const formatDisplayPrice = (val: number | null): string => {
  if (val === null || val === undefined || isNaN(val)) return "";
  return formatCurrencyWithoutSymbol(val);
};

// Helper to parse user typed input string into numeric value (e.g. "100.000" -> 100000)
const parsePriceInput = (val: string): number | null => {
  const digits = val.replace(/\D/g, "");
  if (!digits) return null;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? null : parsed;
};

const FilterModal: React.FC<Props> = ({ dismiss, initialFilters }) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);

  // State for real-time formatted price inputs
  const [minPriceDisplay, setMinPriceDisplay] = useState<string>("");
  const [maxPriceDisplay, setMaxPriceDisplay] = useState<string>("");

  // Sync state with initialFilters
  useEffect(() => {
    setFilters(initialFilters);
    setMinPriceDisplay(formatDisplayPrice(initialFilters.priceRange?.min ?? null));
    setMaxPriceDisplay(formatDisplayPrice(initialFilters.priceRange?.max ?? null));
  }, [initialFilters]);

  // Sync selected suppliers list from tokens array (`${id}__${name}`)
  useEffect(() => {
    if (!filters.suppliers) {
      setSelectedSuppliers([]);
      return;
    }
    const suppliers = filters.suppliers.map((supplierId) => {
      const parts = supplierId.split("__");
      return { id: parts[0], name: parts[1] || parts[0] };
    });
    setSelectedSuppliers(suppliers);
  }, [filters.suppliers]);

  // Supplier Modal
  const [presentSupplier, dismissSupplier] = useIonModal(ModalSelectSupplier, {
    dismiss: (data: string[] | string, role: string) => dismissSupplier(data, role),
    multi: true,
    initialSelectedNames: filters.suppliers,
  });

  const openSupplierModal = () => {
    presentSupplier({
      onWillDismiss: (ev: CustomEvent) => {
        if (ev.detail.role === "confirm") {
          const data = ev.detail.data;
          if (Array.isArray(data)) {
            setFilters((prev) => ({
              ...prev,
              suppliers: data,
            }));
          } else if (typeof data === "string" && data) {
            if (!filters.suppliers.includes(data)) {
              setFilters((prev) => ({
                ...prev,
                suppliers: [...prev.suppliers, data],
              }));
            }
          }
        }
      },
    });
  };

  const handleMinPriceChange = (val: string) => {
    const numericVal = parsePriceInput(val);
    setMinPriceDisplay(numericVal !== null ? formatCurrencyWithoutSymbol(numericVal) : "");
    setFilters((prev) => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        min: numericVal,
      },
    }));
  };

  const handleMaxPriceChange = (val: string) => {
    const numericVal = parsePriceInput(val);
    setMaxPriceDisplay(numericVal !== null ? formatCurrencyWithoutSymbol(numericVal) : "");
    setFilters((prev) => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        max: numericVal,
      },
    }));
  };

  const handleQuickPricePreset = (min: number | null, max: number | null) => {
    setMinPriceDisplay(formatDisplayPrice(min));
    setMaxPriceDisplay(formatDisplayPrice(max));
    setFilters((prev) => ({
      ...prev,
      priceRange: { min, max },
    }));
  };

  const handleRemoveSupplier = (supplierId: string) => {
    setFilters((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => !s.startsWith(`${supplierId}__`)),
    }));
  };

  const handleConfirm = () => {
    dismiss(filters, "confirm");
  };

  const handleReset = () => {
    setFilters(defaultProductFilters);
    setSelectedSuppliers([]);
    setMinPriceDisplay("");
    setMaxPriceDisplay("");
  };

  const isInvalidPriceRange =
    filters.priceRange.min !== null &&
    filters.priceRange.max !== null &&
    filters.priceRange.min > filters.priceRange.max;

  const activeFiltersCount =
    (filters.suppliers?.length || 0) +
    (filters.status ? 1 : 0) +
    (filters.priceRange.min !== null || filters.priceRange.max !== null ? 1 : 0);

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonTitle className="text-base font-semibold text-gray-900">
            Bộ lọc sản phẩm
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => dismiss()}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Đóng
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <div className="p-4 space-y-4">
          {/* Main Filters Container */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-5">
            {/* Active Filters Info (if any) */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  <IonIcon icon={filterOutline} className="text-xs" />
                  <span>Đã chọn {activeFiltersCount} điều kiện</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                >
                  Xóa lọc
                </button>
              </div>
            )}

            {/* 1. Supplier Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Nhà cung cấp
              </label>

              <div
                onClick={openSupplierModal}
                className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <IonIcon icon={storefrontOutline} className="text-base" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {selectedSuppliers.length
                        ? `Đã chọn ${selectedSuppliers.length} nhà cung cấp`
                        : "Tất cả nhà cung cấp"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedSuppliers.length
                        ? selectedSuppliers.map((s) => s.name).join(", ")
                        : "Chạm để chọn nhà cung cấp"}
                    </p>
                  </div>
                </div>
                <IonIcon
                  icon={chevronForward}
                  className="text-gray-400 text-base flex-shrink-0 ml-2"
                />
              </div>

              {/* Selected Suppliers Chips */}
              {selectedSuppliers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedSuppliers.map((supplier) => (
                    <span
                      key={supplier.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
                    >
                      <span>{supplier.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSupplier(supplier.id);
                        }}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-200/60 text-blue-600 transition-colors"
                      >
                        <IonIcon icon={close} className="text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Status Filter */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-800">
                Trạng thái hàng
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "", label: "Tất cả" },
                  { value: PRODUCT_STATUS.ACTIVE, label: "Đang kinh doanh" },
                  { value: PRODUCT_STATUS.INACTIVE, label: "Ngừng kinh doanh" },
                  { value: PRODUCT_STATUS.DRAFT, label: "Nháp" },
                ].map((opt) => {
                  const isSelected = filters.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, status: opt.value }))
                      }
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-center ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Wholesale Price Filter (Giá sỉ) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-800">
                  Giá sỉ
                </label>
                <span className="text-xs font-medium text-gray-500">
                  Đơn vị: VNĐ
                </span>
              </div>

              {/* Price inputs with real-time formatting */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Từ"
                    value={minPriceDisplay}
                    onChange={(e) => handleMinPriceChange(e.target.value)}
                    className={`w-full pl-3 pr-7 py-2.5 bg-gray-50 border ${
                      isInvalidPriceRange ? "border-red-300" : "border-gray-200"
                    } rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                    đ
                  </span>
                </div>

                <span className="text-gray-400 font-medium px-0.5">-</span>

                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Đến"
                    value={maxPriceDisplay}
                    onChange={(e) => handleMaxPriceChange(e.target.value)}
                    className={`w-full pl-3 pr-7 py-2.5 bg-gray-50 border ${
                      isInvalidPriceRange ? "border-red-300" : "border-gray-200"
                    } rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                    đ
                  </span>
                </div>
              </div>

              {/* Invalid price range error indicator */}
              {isInvalidPriceRange && (
                <p className="text-xs text-red-500 mt-1 font-medium">
                  Giá sỉ tối thiểu không được lớn hơn giá tối đa
                </p>
              )}

              {/* Quick Presets for Wholesale Price */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "Dưới 100k", min: null, max: 100000 },
                  { label: "100k - 500k", min: 100000, max: 500000 },
                  { label: "500k - 1 triệu", min: 500000, max: 1000000 },
                  { label: "Trên 1 triệu", min: 1000000, max: null },
                ].map((preset, idx) => {
                  const isPresetActive =
                    filters.priceRange.min === preset.min &&
                    filters.priceRange.max === preset.max;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickPricePreset(preset.min, preset.max)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isPresetActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </IonContent>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-3">
          <IonButton
            className="flex-1 h-11"
            fill="outline"
            onClick={handleReset}
          >
            Đặt lại
          </IonButton>
          <IonButton
            className="flex-1 h-11"
            onClick={handleConfirm}
            disabled={isInvalidPriceRange}
          >
            Áp dụng
          </IonButton>
        </div>
      </div>
    </IonPage>
  );
};

export default FilterModal;
