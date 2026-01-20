import React, { useEffect, useMemo, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonLabel,
  IonTextarea,
  IonChip,
  IonCard,
  IonCardContent,
  IonActionSheet,
  IonText,
  IonInput,
  IonSpinner,
  useIonToast,
  useIonModal,
  IonRippleEffect,
} from "@ionic/react";
import {
  chevronBack,
  ellipsisHorizontal,
  image,
  barcode,
  createOutline,
  trashOutline,
  printOutline,
  saveOutline,
  closeOutline,
  search,
} from "ionicons/icons";
import { useParams } from "react-router";

import useProduct from "@/hooks/apis/useProduct";
import BarcodeModal from "./components/BarcodeModal";
import InventoryHistory from "./components/InventoryHistory";
import { MediaUpload } from "./components/MediaUpload";
import { useProductEdit } from "./hooks/useProductEdit";
import {
  formatCurrencyWithoutSymbol,
  parseCurrencyInput,
} from "@/helpers/formatters";
import type { IProduct } from "@/types/product.type";
import { useAuth } from "@/hooks";
import { UserRole } from "@/common/enums/user";
import { debounce } from "@/helpers/debounce";
import { captureException, createExceptionContext } from "@/helpers/posthogHelper";
import { Refresher } from "@/components/Refresher/Refresher";
import ModalSelectCategory from "@/components/ModalSelectCategory";
import ModalSelectSupplier from "@/components/ModalSelectSupplier";
import { OverlayEventDetail } from "@ionic/react/dist/types/components/react-component-lib/interfaces";
import { ProductImage, VALIDATION_RULES } from "./types/productEdit.d";
import { getS3ImageUrl } from "@/helpers/fileHelper";

import "./ProductDetail.css";

interface HistoryItem {
  id: string;
  receiptNumber: string;
  quantity: number;
  value: number;
  status: string;
  type: 'order' | 'debt' | 'import' | 'check';
  customer?: {
    id: string;
    name: string;
  };
}

interface HistoryData {
  import: HistoryItem[];
  return: HistoryItem[];
  check: HistoryItem[];
  order: HistoryItem[];
  debt: HistoryItem[];
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<IProduct | null>(null);

  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedTab, setSelectedTab] = useState("import");

  // Editing state - now per field
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedValues, setEditedValues] = useState({
    inventory: 0,
    sellingPrice: 0,
    retailPrice: 0,
    costPrice: 0,
    productName: "",
    category: "",
    suppliers: [] as { id: string; name: string }[],
    description: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    inventory: "",
    sellingPrice: "",
    retailPrice: "",
    costPrice: "",
    productName: "",
    category: "",
    suppliers: "",
    description: "",
  });
  const [pendingSave, setPendingSave] = useState(false);

  const [history, setHistory] = useState<HistoryData>({
    import: [],
    return: [],
    check: [],
    order: [],
    debt: [],
  });
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState({
    import: true,
    return: true,
    check: true,
    order: true,
    debt: true,
  });
  const [page, setPage] = useState({
    import: 1,
    return: 1,
    check: 1,
    order: 1,
    debt: 1,
  });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);

  // Image management state
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  // TODO: Will be remove after migration
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);
  // Track original images to detect changes
  const [originalProductImages, setOriginalProductImages] = useState<ProductImage[]>([]);

  const [presentToast] = useIonToast();

  const { getDetail, getHistory, update: updateProduct } = useProduct();

  // Product edit functionality
  const { suppliers } = useProductEdit(id!);

  // Modal for category selection
  const [presentCategoryModal, dismissCategoryModal] = useIonModal(
    ModalSelectCategory,
    {
      dismiss: (data: any, role: string) => dismissCategoryModal(data, role),
    }
  );

  const openModalSelectCategory = () => {
    presentCategoryModal({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;
        if (role === "confirm") {
          // Update edited value and re-validate
          handleFieldChange("category", data || "");
        }
      },
    });
  };

  // Modal for supplier selection (multi-select)
  const [presentSupplierModal, dismissSupplierModal] = useIonModal(
    ModalSelectSupplier,
    {
      dismiss: (data: any, role: string) => dismissSupplierModal(data, role),
      initialSelectedNames: editedValues.suppliers || [],
      multi: true,
    }
  );

  const openModalSelectSuppliers = () => {
    presentSupplierModal({
      onWillDismiss: async (event: CustomEvent<OverlayEventDetail>) => {
        const { role, data } = event.detail;
        if (role === "confirm") {
          const tokens: string[] = Array.isArray(data) ? data : [];
          const items = tokens
            .filter((t) => typeof t === "string" && t.includes("__"))
            .map((t) => {
              const [id, name] = t.split("__");
              return { id, name };
            });
          handleFieldChange("suppliers", items);
        }
      },
    });
  };

  const fetchProductDetail = async () => {
    try {
      const result = await getDetail(id);

      if (!result) {
        return presentToast({
          message: "Không tìm thấy sản phẩm",
          duration: 1000,
          position: "top",
          color: "warning",
        });
      }

      if (result.imageUrls) {
        setProductImageUrls(result.imageUrls);
      }

      if (result.images) {
        setProductImages(result.images);
        setOriginalProductImages(result.images); // Store original images
      }

      setProduct(result);
      setEditedValues({
        inventory: result.inventory || 0,
        sellingPrice: result.sellingPrice || 0,
        retailPrice: result.retailPrice || 0,
        costPrice: result.costPrice || 0,
        productName: result.productName || "",
        category: result.category || "",
        suppliers: result.suppliers?.map((s) => ({ id: s.id, name: s.name })) || [],
        description: result.description || "",
      });
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ProductDetail',
        'ProductDetail',
        'fetchProductDetail'
      ));
      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  useEffect(() => {
    id && fetchProductDetail();
  }, [id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // For return tab, fetch both order and debt data
      if (selectedTab === "export") {
        // Fetch order data
        const orderResult = await getHistory({ productId: id, type: "order" });
        const orderData = orderResult && orderResult.length ? orderResult.map((order: Record<string, any>) => {
          const productItem = order.items.find((item: Record<string, any>) => item.productId === id);

          return {
            id: order.id,
            receiptNumber: order.code,
            quantity: productItem?.quantity || 0,
            value: productItem?.price || 0,
            status: order.status,
            type: 'order' as const,
            customer: order.customer ? {
              id: order.customer.id,
              name: order.customer.name,
            } : undefined,
          };
        }) : [];

        // Fetch debt data
        const debtResult = await getHistory({ productId: id, type: "debt" });
        const debtData = debtResult && debtResult.length ? debtResult.map((item: Record<string, any>) => {
          const [receiptItemMap, receiptImportMap] = Object.entries(item);
          const [, receipt] = receiptImportMap;
          const [, receiptItem] = receiptItemMap;

          return {
            id: receipt.id,
            receiptNumber: receipt.code,
            quantity: receiptItem.quantity,
            value: receiptItem.costPrice,
            status: receipt.status,
            type: 'debt' as const,
            customer: receipt.customer ? {
              id: receipt.customer.id,
              name: receipt.customer.name,
            } : undefined,
          };
        }) : [];

        setHistory((prev) => ({
          ...prev,
          order: orderData,
          debt: debtData,
        }));

        setHasMore((prev) => ({
          ...prev,
          order: orderData.length === 10,
          debt: debtData.length === 10,
        }));

        setPage((prev) => ({
          ...prev,
          order: 1,
          debt: 1,
        }));
      } else {
        // For other tabs (import, check), use the original logic
        const result = await getHistory({ productId: id, type: selectedTab });

        if (!result || !result.length) {
          return;
        }

        const data = result.map((item: Record<string, any>) => {
          const [receiptItemMap, receiptImportMap] = Object.entries(item);

          const [, receipt] = receiptImportMap;
          const [, receiptItem] = receiptItemMap;

          return {
            id: receipt.id,
            receiptNumber: receipt.receiptNumber,
            quantity: receiptItem.quantity,
            value: receiptItem.costPrice,
            status: receipt.status,
            type: selectedTab as 'import' | 'check',
          };
        });

        setHistory((prev) => ({
          ...prev,
          [selectedTab]: data,
        }));
        setHasMore((prev) => ({
          ...prev,
          [selectedTab]: data.length === 10,
        }));
        setPage((prev) => ({
          ...prev,
          [selectedTab]: 1,
        }));
      }
    } catch (error) {
      captureException(error as Error, createExceptionContext(
        'ProductDetail',
        'InventoryHistory',
        'fetchHistory'
      ));
      presentToast({
        message: (error as Error).message,
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedTab]);

  const handleLoadMore = async () => {
    try {
      setLoading(true);
      // TODO: Replace with your actual API call

      const nextPage = page[selectedTab as keyof typeof page] + 1;

      // Update page for the current tab
      setPage((prev) => ({
        ...prev,
        [selectedTab]: nextPage,
      }));

      // Example: If no more data, set hasMore to false
      if (nextPage > 3) {
        setHasMore((prev) => ({
          ...prev,
          [selectedTab]: false,
        }));
      }
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if images have changed from original
  const hasImageChanges = useMemo(() => {
    if (productImages.length !== originalProductImages.length) {
      return true;
    }

    // Check if any image IDs are different
    const currentIds = productImages.map(img => img.id).sort();
    const originalIds = originalProductImages.map(img => img.id).sort();

    return currentIds.some((id, index) => id !== originalIds[index]);
  }, [productImages, originalProductImages]);

  const handleRefresh = async (event: CustomEvent) => {
    try {
      // Store current images before refresh
      const currentImages = [...productImages];

      // Reload product detail and history
      await Promise.all([
        fetchProductDetail(),
        fetchHistory()
      ]);

      // If images haven't changed during refresh, restore the current state
      // This prevents the upload button from appearing when no actual changes were made
      if (productImages.length === currentImages.length &&
        productImages.every((img, index) => img.id === currentImages[index]?.id)) {
        setProductImages(currentImages);
        setOriginalProductImages(currentImages);
      }

      presentToast({
        message: "Đã tải lại dữ liệu",
        duration: 1500,
        position: "top",
        color: "success",
      });
    } catch (error) {
      presentToast({
        message: "Lỗi khi tải lại dữ liệu",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    } finally {
      event.detail.complete();
    }
  };

  const handleActionClick = async (action: string) => {
    switch (action) {
      case "edit":
        // Handle edit action
        console.log("Edit clicked");
        break;
      case "delete":
        // Handle delete action
        console.log("Delete clicked");
        break;
      case "print":
        // Handle print action
        console.log("Print clicked");
        break;
    }

    setShowActionSheet(false);

    presentToast({
      message: "Tính năng này đang được phát triển",
      duration: 2000,
      position: "top",
      color: "warning",
    });
  };

  // Get the first image URL or use fallback
  const primaryImageUrl = useMemo(() => {
    if (product?.images && product.images.length > 0) {
      return getS3ImageUrl(product.images[0].path);
    }

    if (product?.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }

    return null;
  }, [product?.images, product?.imageUrls])

  const isShowCostPrice = useMemo(() => {
    const roles = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.MANAGER, UserRole.EMPLOYEE];
    return user?.role ? roles.includes(user.role) : false;
  }, [user?.role]);

  const canEditCostPrice = useMemo(() => {
    const roles = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.MANAGER];
    return user?.role ? roles.includes(user.role) : false;
  }, [user?.role]);

  const handleEditFieldClick = (field: string) => {
    setEditingField(field);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const handleCancelFieldEdit = (field: string) => {
    setEditingField(null);
    // Restore original value
    setEditedValues((prev) => ({
      ...prev,
      [field]: product?.[field as keyof IProduct] || 0,
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  };

  const validateField = (field: string, value: string | number | string[] | { id: string; name: string }[]): string => {
    // For numeric fields (inventory, prices)
    if (field === "inventory" || field === "sellingPrice" || field === "retailPrice" || field === "costPrice") {
      const numValue = typeof value === 'number' ? value : parseFloat(value as string);
      if (numValue < 0) {
        return "Giá trị không được âm";
      }
      if (field === "inventory" && !Number.isInteger(numValue)) {
        return "Tồn kho phải là số nguyên";
      }
      if ((field === "sellingPrice" || field === "retailPrice" || field === "costPrice") && numValue === 0) {
        return "Giá không được bằng 0";
      }
    }

    // For text fields
    if (field === "productName") {
      const strValue = value as string;
      if (!strValue || strValue.trim().length === 0) {
        return "Tên sản phẩm không được để trống";
      }
      if (strValue.length > 100) {
        return "Tên sản phẩm không được vượt quá 100 ký tự";
      }
    }

    if (field === "category") {
      const strValue = value as string;
      if (!strValue || strValue.trim().length === 0) {
        return "Danh mục không được để trống";
      }
    }

    if (field === "suppliers") {
      const arrValue = value as any[];
      if (!arrValue || arrValue.length === 0) {
        return "Phải chọn ít nhất một nhà cung cấp";
      }
    }

    return "";
  };

  const handleFieldChange = (
    field: keyof typeof editedValues,
    value: any,
  ) => {
    // Special handling for suppliers: expect array of { id, name }
    if (field === "suppliers") {
      const items = Array.isArray(value) ? value : [];
      setEditedValues((prev) => ({
        ...prev,
        suppliers: items as { id: string; name: string }[],
      }));

      const error = validateField(field, items as { id: string; name: string }[]);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
      return;
    }

    let processedValue: any;
    // Handle different field types
    if (field === "inventory" || field === "sellingPrice" || field === "retailPrice" || field === "costPrice") {
      // Numeric fields
      if (field === "inventory") {
        // Inventory: parse as integer, no formatting
        processedValue = parseInt(value as string) || 0;
      } else {
        // Price fields: parse formatted currency input
        processedValue = parseCurrencyInput(value as string);
      }
    } else {
      // String or array fields (productName, category, suppliers, description)
      processedValue = value;
    }

    setEditedValues((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    const error = validateField(field, processedValue);
    setValidationErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  // Debounced save function
  const debouncedSave = useMemo(
    () =>
      debounce(async (field: string, value: any) => {
        try {
          setPendingSave(false);
          setIsSaving(true);

          const updateData: any = {};

          // For suppliers, we need to handle the array differently
          if (field === "suppliers") {
            const items = value as { id: string; name: string }[];
            // const supplierIds = items.map((i) => i.id).filter(Boolean);
            updateData.suppliers = items; // Send IDs to API
          } else {
            updateData[field] = value;
          }

          await updateProduct(id, updateData);

          // Update product state
          if (field === "suppliers") {
            const items = value as { id: string; name: string }[];
            const updatedSuppliers = items.map((it) => {
              const match = suppliers.find((s) => s.id === it.id);
              return {
                id: it.id,
                name: it.name,
                costPrice: (match as any)?.costPrice ?? 0,
              };
            });
            setProduct((prev) => (prev ? { ...prev, suppliers: updatedSuppliers } : prev));
          } else {
            setProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
          }

          setEditingField(null);

          presentToast({
            message: "Cập nhật thành công",
            duration: 2000,
            position: "top",
            color: "success",
          });
        } catch (error) {
          presentToast({
            message: (error as Error).message || "Lỗi khi cập nhật sản phẩm",
            duration: 2000,
            position: "top",
            color: "danger",
          });
        } finally {
          setIsSaving(false);
        }
      }, 1000),
    [id, suppliers],
  );

  const handleSaveField = async (field: string) => {
    const value = editedValues[field as keyof typeof editedValues];
    const error = validateField(field, value);

    if (error) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
      presentToast({
        message: error,
        duration: 2000,
        position: "top",
        color: "danger",
      });
      return;
    }

    // Check if value has changed
    const originalValue = product?.[field as keyof IProduct];
    if (value === originalValue) {
      setEditingField(null);
      presentToast({
        message: "Không có thay đổi nào",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    // Trigger debounced save
    setPendingSave(true);
    debouncedSave(field, value);
  };

  // Handle image upload
  const handleImageUpload = async (images: ProductImage[]): Promise<boolean> => {
    try {
      if (!images || images.length === 0) {
        presentToast({
          message: 'Vui lòng chọn ít nhất 1 hình ảnh',
          duration: 3000,
          position: 'top',
          color: 'warning'
        });
        return false;
      }

      // Update product with new fileIds
      const updatedProductImages = {
        images: images.map(image => image.id)
      };

      // Call API to update product with new images
      await updateProduct(id, updatedProductImages);

      // Update original images to reflect the new state
      setOriginalProductImages(images);

      presentToast({
        message: 'Cập nhật hình ảnh thành công',
        duration: 2000,
        position: 'top',
        color: 'success'
      });

      return true;
    } catch (error) {
      presentToast({
        message: `Lỗi khi cập nhật hình ảnh: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      return false;
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton routerLink="/tabs/products" className="text-gray-600">
              <IonIcon slot="icon-only" icon={chevronBack} />
              Trở lại
            </IonButton>
          </IonButtons>
          <IonTitle className="font-medium text-gray-800">
            Chi tiết sản phẩm
          </IonTitle>
          <IonButtons slot="end">
            <IonButton
              className="text-gray-600"
              onClick={() => setShowActionSheet(true)}
            >
              <IonIcon slot="icon-only" icon={ellipsisHorizontal} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        <Refresher onRefresh={handleRefresh} />
        {/* Product Image Section */}
        <div className="mb-6">
          <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
            {primaryImageUrl ? (
              <img
                src={primaryImageUrl}
                alt={product?.productName || "Product image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center"><ion-icon name="image" class="text-6xl text-gray-400"></ion-icon></div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IonIcon icon={image} className="text-6xl text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Basic Info Card */}
        <IonCard className="rounded-xl shadow-sm">
          <IonCardContent className="p-4">
            {/* Product Code */}
            <div className="mb-4 flex gap-2 justify-between items-center">
              <div>
                <IonLabel className="text-lg text-gray-500">Mã sản phẩm:</IonLabel>
                <IonText>
                  <h1>{product?.code}</h1>
                </IonText>
              </div>

              <IonButton
                fill="clear"
                size="default"
                className="text-blue-600"
                onClick={() => setShowBarcodeModal(true)}
              >
                <IonIcon icon={barcode} slot="start" />
                Mã vạch
              </IonButton>
            </div>

            {/* Product Name */}
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <IonLabel className="text-lg text-gray-500">
                  Tên sản phẩm:
                </IonLabel>
                <div className="flex gap-2">
                  {editingField === "productName" ? (
                    <>
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => handleCancelFieldEdit("productName")}
                        className="text-gray-500"
                      >
                        <IonIcon icon={closeOutline} slot="icon-only" />
                      </IonButton>
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => handleSaveField("productName")}
                        className="text-green-600"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <IonSpinner name="crescent" className="w-4 h-4" />
                        ) : (
                          <IonIcon icon={saveOutline} slot="icon-only" />
                        )}
                      </IonButton>
                    </>
                  ) : (
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleEditFieldClick("productName")}
                      className="text-blue-600"
                    >
                      <IonIcon icon={createOutline} slot="icon-only" />
                    </IonButton>
                  )}
                </div>
              </div>
              {editingField === "productName" ? (
                <IonInput
                  value={editedValues.productName || ""}
                  onIonInput={(e) =>
                    handleFieldChange("productName", e.detail.value!)
                  }
                  placeholder="Nhập tên sản phẩm"
                  className="mt-2 border border-blue-300 rounded-lg py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg"
                />
              ) : (
                <IonText>
                  <h1>{product?.productName}</h1>
                </IonText>
              )}
              {validationErrors.productName && (
                <IonText color="danger">
                  <p className="text-xs mt-1">{validationErrors.productName}</p>
                </IonText>
              )}
            </div>

            {/* Categories */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-lg text-gray-500">
                  Nhóm hàng:
                </IonLabel>
                {editingField === "category" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("category")}
                      className="text-gray-500"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("category")}
                      className="text-green-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <IonSpinner name="crescent" className="w-4 h-4" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("category")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "category" ? (
                <div className="mt-2">
                  <div
                    className="ion-activatable receipt-import-ripple-parent break-normal p-2 border border-blue-300 rounded-lg text-lg"
                    onClick={openModalSelectCategory}
                    style={{ cursor: "pointer" }}
                  >
                    <IonIcon icon={search} className="text-2xl mr-2" />
                    {editedValues.category || "Chọn nhóm hàng"}
                    <IonRippleEffect className="custom-ripple"></IonRippleEffect>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <IonChip className="bg-blue-50 text-blue-600 text-lg">
                    {product?.category || "--"}
                  </IonChip>
                </div>
              )}
              {validationErrors.category && (
                <IonText color="danger">
                  <p className="text-xs mt-1">{validationErrors.category}</p>
                </IonText>
              )}
            </div>

            {/* Suppliers */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-lg text-gray-500">
                  Nhà cung cấp:
                </IonLabel>
                {editingField === "suppliers" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("suppliers")}
                      className="text-gray-500"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("suppliers")}
                      className="text-green-600"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <IonSpinner name="crescent" className="w-4 h-4" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("suppliers")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "suppliers" ? (
                <div className="mt-2">
                  <div
                    className="ion-activatable receipt-import-ripple-parent break-normal p-2 border border-blue-300 rounded-lg text-lg"
                    onClick={openModalSelectSuppliers}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="text-gray-500 flex items-center">
                      <IonIcon icon={search} className="text-2xl mr-2" />
                      Chọn nhà cung cấp
                    </span>
                    {/* {editedValues.suppliers?.length ? editedValues.suppliers.map((s) => s.name).join(", ") : "Chọn nhà cung cấp"} */}
                    <IonRippleEffect className="custom-ripple"></IonRippleEffect>
                  </div>
                  {/* <p className="text-xs text-gray-500 mt-1">Bấm để chọn nhiều nhà cung cấp</p> */}
                  {editedValues.suppliers?.length ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedValues.suppliers.map((s) => (
                        <IonChip key={s.id} className="bg-blue-50 text-blue-600">
                          {s.name}
                        </IonChip>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {product?.suppliers && product.suppliers.length > 0 ? (
                    product.suppliers.map((supplier) => (
                      <IonChip
                        key={supplier.id}
                        className="bg-blue-50 text-blue-600 text-lg"
                      >
                        {supplier.name}
                      </IonChip>
                    ))
                  ) : (
                    <IonChip className="bg-blue-50 text-blue-600">--</IonChip>
                  )}
                </div>
              )}
              {validationErrors.suppliers && (
                <IonText color="danger">
                  <p className="text-xs mt-1">{validationErrors.suppliers}</p>
                </IonText>
              )}
            </div>

            {/* Inventory */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-lg text-gray-500">Tồn kho:</IonLabel>
                {editingField === "inventory" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("inventory")}
                      disabled={isSaving || pendingSave}
                      className="text-gray-600"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("inventory")}
                      disabled={isSaving || pendingSave}
                      className="text-blue-600"
                    >
                      {isSaving || pendingSave ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("inventory")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "inventory" ? (
                <>
                  <IonInput
                    type="number"
                    value={editedValues.inventory}
                    onIonInput={(e) =>
                      handleFieldChange("inventory", e.detail.value!)
                    }
                    className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 text-lg ${validationErrors.inventory ? "border-red-500 focus:border-red-500" : "border-blue-300 focus:border-blue-500"}`}
                    placeholder="Nhập số lượng tồn kho"
                    autofocus
                  />
                  {validationErrors.inventory && (
                    <IonText color="danger">
                      <p className="text-xs mt-1">
                        {validationErrors.inventory}
                      </p>
                    </IonText>
                  )}
                </>
              ) : (
                <IonText>
                  <h1>{product?.inventory || "--"}</h1>
                </IonText>
              )}
            </div>

            {/* Prices */}
            {isShowCostPrice ? (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <IonLabel className="text-lg text-gray-500">Giá vốn:</IonLabel>
                  {canEditCostPrice &&
                    (editingField === "costPrice" ? (
                      <div className="flex gap-2">
                        <IonButton
                          size="small"
                          fill="clear"
                          onClick={() => handleCancelFieldEdit("costPrice")}
                          disabled={isSaving || pendingSave}
                          className="text-gray-600"
                        >
                          <IonIcon icon={closeOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton
                          size="small"
                          fill="clear"
                          onClick={() => handleSaveField("costPrice")}
                          disabled={isSaving || pendingSave}
                          className="text-blue-600"
                        >
                          {isSaving || pendingSave ? (
                            <IonSpinner name="crescent" />
                          ) : (
                            <IonIcon icon={saveOutline} slot="icon-only" />
                          )}
                        </IonButton>
                      </div>
                    ) : (
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => handleEditFieldClick("costPrice")}
                        className="text-blue-600"
                      >
                        <IonIcon icon={createOutline} slot="icon-only" />
                      </IonButton>
                    ))}
                </div>
                {editingField === "costPrice" ? (
                  <>
                    <IonInput
                      type="text"
                      inputmode="numeric"
                      value={formatCurrencyWithoutSymbol(
                        editedValues.costPrice,
                      )}
                      onIonInput={(e) =>
                        handleFieldChange("costPrice", e.detail.value!)
                      }
                      className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 text-lg ${validationErrors.costPrice ? "border-red-500 focus:border-red-500" : "border-blue-300 focus:border-blue-500"}`}
                      placeholder="Nhập giá vốn"
                      autofocus
                    />
                    {validationErrors.costPrice && (
                      <IonText color="danger">
                        <p className="text-xs mt-1">
                          {validationErrors.costPrice}
                        </p>
                      </IonText>
                    )}
                  </>
                ) : (
                  <IonText>
                    <h1>
                      {product?.costPrice
                        ? formatCurrencyWithoutSymbol(product?.costPrice)
                        : "--"}
                    </h1>
                  </IonText>
                )}
              </div>
            ) : null}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-lg text-gray-500">Giá sỉ:</IonLabel>
                {editingField === "sellingPrice" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("sellingPrice")}
                      disabled={isSaving || pendingSave}
                      className="text-gray-600"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("sellingPrice")}
                      disabled={isSaving || pendingSave}
                      className="text-blue-600"
                    >
                      {isSaving || pendingSave ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("sellingPrice")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "sellingPrice" ? (
                <>
                  <IonInput
                    type="text"
                    inputmode="numeric"
                    value={formatCurrencyWithoutSymbol(
                      editedValues.sellingPrice,
                    )}
                    onIonInput={(e) =>
                      handleFieldChange("sellingPrice", e.detail.value!)
                    }
                    className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 text-lg ${validationErrors.sellingPrice ? "border-red-500 focus:border-red-500" : "border-blue-300 focus:border-blue-500"}`}
                    placeholder="Nhập giá sỉ"
                    autofocus
                  />
                  {validationErrors.sellingPrice && (
                    <IonText color="danger">
                      <p className="text-xs mt-1">
                        {validationErrors.sellingPrice}
                      </p>
                    </IonText>
                  )}
                </>
              ) : (
                <IonText>
                  <h1>
                    {product?.sellingPrice
                      ? formatCurrencyWithoutSymbol(product?.sellingPrice)
                      : "--"}
                  </h1>
                </IonText>
              )}
            </div>

            {/* Retail Price */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-lg text-gray-500">Giá lẻ:</IonLabel>
                {editingField === "retailPrice" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("retailPrice")}
                      disabled={isSaving || pendingSave}
                      className="text-gray-600"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("retailPrice")}
                      disabled={isSaving || pendingSave}
                      className="text-blue-600"
                    >
                      {isSaving || pendingSave ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("retailPrice")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "retailPrice" ? (
                <>
                  <IonInput
                    type="text"
                    inputmode="numeric"
                    value={formatCurrencyWithoutSymbol(
                      editedValues.retailPrice,
                    )}
                    onIonInput={(e) =>
                      handleFieldChange("retailPrice", e.detail.value!)
                    }
                    className={`border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-200 text-lg ${validationErrors.retailPrice ? "border-red-500 focus:border-red-500" : "border-blue-300 focus:border-blue-500"}`}
                    placeholder="Nhập giá lẻ"
                    autofocus
                  />
                  {validationErrors.retailPrice && (
                    <IonText color="danger">
                      <p className="text-xs mt-1">
                        {validationErrors.retailPrice}
                      </p>
                    </IonText>
                  )}
                </>
              ) : (
                <IonText>
                  <h1>
                    {product?.retailPrice
                      ? formatCurrencyWithoutSymbol(product?.retailPrice)
                      : "--"}
                  </h1>
                </IonText>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <IonLabel className="text-2xl text-gray-500">
                  Ghi chú
                </IonLabel>
                {editingField === "description" ? (
                  <div className="flex gap-2">
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleCancelFieldEdit("description")}
                      disabled={isSaving || pendingSave}
                      className="text-gray-600"
                    >
                      <IonIcon icon={closeOutline} slot="icon-only" />
                    </IonButton>
                    <IonButton
                      size="small"
                      fill="clear"
                      onClick={() => handleSaveField("description")}
                      disabled={isSaving || pendingSave}
                      className="text-blue-600"
                    >
                      {isSaving || pendingSave ? (
                        <IonSpinner name="crescent" />
                      ) : (
                        <IonIcon icon={saveOutline} slot="icon-only" />
                      )}
                    </IonButton>
                  </div>
                ) : (
                  <IonButton
                    size="small"
                    fill="clear"
                    onClick={() => handleEditFieldClick("description")}
                    className="text-blue-600"
                  >
                    <IonIcon icon={createOutline} slot="icon-only" />
                  </IonButton>
                )}
              </div>
              {editingField === "description" ? (
                <>
                  <IonTextarea
                    placeholder="Nhập ghi chú..."
                    rows={3}
                    className="border border-blue-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg"
                    value={editedValues.description}
                    onIonInput={(e) => handleFieldChange("description", e.detail.value!)}
                  />
                  {validationErrors.description && (
                    <IonText color="danger" className="text-xs">
                      {validationErrors.description}
                    </IonText>
                  )}
                </>
              ) : (
                <IonTextarea
                  placeholder="Nhập ghi chú..."
                  rows={3}
                  className="border rounded-lg px-2 text-lg"
                  value={product?.description}
                  readonly
                />
              )}
            </div>
          </IonCardContent>
        </IonCard>

        {/* Media Upload Section */}
        <MediaUpload
          imageUrls={productImageUrls}
          images={productImages}
          onImagesChange={setProductImages}
          onConfirmUpload={handleImageUpload}
          maxImages={VALIDATION_RULES.IMAGES.MAX_COUNT}
          disabled={productImages.length >= VALIDATION_RULES.IMAGES.MAX_COUNT}
          hasChanges={hasImageChanges}
          enableCompression={true}
        />

        <InventoryHistory
          data={history}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onChangeTab={(e) => setSelectedTab(e.detail.value as string)}
          selectedTab={selectedTab}
        />

        <BarcodeModal
          isOpen={showBarcodeModal}
          onDidDismiss={() => setShowBarcodeModal(false)}
          productName={product?.productName}
          productCode={product?.code}
        />

        {/* Action Sheet */}
        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: "Sửa",
              icon: createOutline,
              handler: () => handleActionClick("edit"),
              cssClass: "action-sheet-button",
            },
            {
              text: "Xóa",
              icon: trashOutline,
              role: "destructive",
              handler: () => handleActionClick("delete"),
              cssClass: "action-sheet-destructive",
            },
            {
              text: "In tem mã",
              icon: printOutline,
              handler: () => handleActionClick("print"),
              cssClass: "action-sheet-button",
            },
            {
              text: "Hủy",
              role: "cancel",
              cssClass: "action-sheet-cancel",
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ProductDetail;
