import { useState, useEffect, useCallback } from 'react';
import { useIonToast } from '@ionic/react';
import useProduct from '@/hooks/apis/useProduct';
import useSupplier from '@/hooks/apis/useSupplier';
import { IProduct } from '@/types/product.type';
import {
  ProductEditFormData,
  ProductEditValidation,
  ProductEditState,
  ProductEditActions,
  UseProductEdit,
  Category,
  Supplier,
  VALIDATION_RULES,
  ProductEditField
} from '@/pages/Product/ProductDetail/types/productEdit.d';

const initialFormData: ProductEditFormData = {
  productName: '',
  category: '',
  suppliers: [],
  supplierIds: [],
  description: '',
  imageUrls: []
};

const initialValidation: ProductEditValidation = {
  productName: '',
  category: '',
  suppliers: '',
  description: '',
  images: ''
};

const initialMediaUpload = {
  isUploading: false,
  uploadProgress: 0,
  uploadedImages: [],
  error: null
};

export const useProductEdit = (productId: string): UseProductEdit => {
  const [presentToast] = useIonToast();
  const productApi = useProduct();
  const supplierApi = useSupplier();

  // State management
  const [state, setState] = useState<ProductEditState>({
    isEditing: false,
    editingField: null,
    formData: initialFormData,
    validation: initialValidation,
    mediaUpload: initialMediaUpload,
    isSaving: false,
    hasChanges: false
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<IProduct | null>(null);

  // Load initial data
  useEffect(() => {
    loadProductData();
    loadCategories();
    loadSuppliers();
  }, [productId]);

  const loadProductData = async () => {
    try {
      const product = await productApi.getDetail(productId);
      setOriginalProduct(product);
      
      const formData: ProductEditFormData = {
        productName: product.productName || '',
        category: product.category || '',
        suppliers: product.suppliers?.map(s => ({ id: s.id, name: s.name })) || [],
        supplierIds: product.suppliers?.map(s => s.id) || [],
        description: product.description || '',
        imageUrls: product.imageUrls || []
      };

      setState(prev => ({
        ...prev,
        formData
      }));
    } catch (error) {
      presentToast({
        message: `Lỗi khi tải thông tin sản phẩm: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    }
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const response = await productApi.getCategories({}, 1, 100);
      setCategories(response.data || []);
    } catch (error) {
      presentToast({
        message: `Lỗi khi tải danh mục: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadSuppliers = async () => {
    setIsLoadingSuppliers(true);
    try {
      const response = await supplierApi.getList({}, 1, 100);
      setSuppliers(response.data || []);
    } catch (error) {
      presentToast({
        message: `Lỗi khi tải nhà cung cấp: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // Validation functions
  const validateField = useCallback((field: ProductEditField, value: any): string => {
    switch (field) {
      case 'productName':
        if (VALIDATION_RULES.PRODUCT_NAME.REQUIRED && !value?.trim()) {
          return 'Tên sản phẩm là bắt buộc';
        }
        if (value?.length < VALIDATION_RULES.PRODUCT_NAME.MIN_LENGTH) {
          return `Tên sản phẩm phải có ít nhất ${VALIDATION_RULES.PRODUCT_NAME.MIN_LENGTH} ký tự`;
        }
        if (value?.length > VALIDATION_RULES.PRODUCT_NAME.MAX_LENGTH) {
          return `Tên sản phẩm không được vượt quá ${VALIDATION_RULES.PRODUCT_NAME.MAX_LENGTH} ký tự`;
        }
        break;

      case 'category':
        if (VALIDATION_RULES.CATEGORY.REQUIRED && !value?.trim()) {
          return 'Danh mục là bắt buộc';
        }
        break;

      case 'suppliers':
        if (Array.isArray(value)) {
          if (value.length > VALIDATION_RULES.SUPPLIERS.MAX_COUNT) {
            return `Không được chọn quá ${VALIDATION_RULES.SUPPLIERS.MAX_COUNT} nhà cung cấp`;
          }
        }
        break;

      case 'description':
        if (value?.length > VALIDATION_RULES.DESCRIPTION.MAX_LENGTH) {
          return `Mô tả không được vượt quá ${VALIDATION_RULES.DESCRIPTION.MAX_LENGTH} ký tự`;
        }
        break;

      default:
        break;
    }
    return '';
  }, []);

  // Actions
  const setEditingField = useCallback((field: string | null) => {
    setState(prev => ({
      ...prev,
      editingField: field,
      isEditing: field !== null
    }));
  }, []);

  const updateFormData = useCallback((field: ProductEditField, value: any) => {
    setState(prev => {
      const newFormData = { ...prev.formData, [field]: value };
      const validationError = validateField(field, value);
      const newValidation = { ...prev.validation, [field]: validationError };
      
      // Check if there are changes
      const hasChanges = JSON.stringify(newFormData) !== JSON.stringify(originalProduct ? {
        productName: originalProduct.productName || '',
        category: originalProduct.category || '',
        suppliers: originalProduct.suppliers?.map(s => ({ id: s.id, name: s.name })) || [],
        supplierIds: originalProduct.suppliers?.map(s => s.id) || [],
        description: originalProduct.description || '',
        imageUrls: originalProduct.imageUrls || []
      } : initialFormData);

      return {
        ...prev,
        formData: newFormData,
        validation: newValidation,
        hasChanges
      };
    });
  }, [validateField, originalProduct]);

  const saveChanges = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isSaving: true }));
    
    try {
      // Validate all fields
      const validationErrors: Partial<ProductEditValidation> = {};
      let hasErrors = false;

      Object.keys(state.formData).forEach(key => {
        const field = key as ProductEditField;
        const error = validateField(field, state.formData[field]);
        if (error) {
          validationErrors[field as keyof ProductEditValidation] = error;
          hasErrors = true;
        }
      });

      if (hasErrors) {
        setState(prev => ({
          ...prev,
          validation: { ...prev.validation, ...validationErrors },
          isSaving: false
        }));
        return false;
      }

      // Prepare update data
      const updateData = {
        productName: state.formData.productName,
        category: state.formData.category,
        supplierIds: state.formData.supplierIds,
        description: state.formData.description,
        imageUrls: state.formData.imageUrls
      };

      await productApi.update(productId, updateData);
      
      // Reload product data to get updated info
      await loadProductData();
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        hasChanges: false,
        isEditing: false,
        editingField: null
      }));

      presentToast({
        message: 'Cập nhật sản phẩm thành công',
        duration: 2000,
        position: 'top',
        color: 'success'
      });

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, isSaving: false }));
      
      presentToast({
        message: `Lỗi khi cập nhật sản phẩm: ${(error as Error).message}`,
        duration: 3000,
        position: 'top',
        color: 'danger'
      });
      
      return false;
    }
  }, [state.formData, validateField, productId, productApi, presentToast, loadProductData]);

  const resetForm = useCallback(() => {
    if (originalProduct) {
      const formData: ProductEditFormData = {
        productName: originalProduct.productName || '',
        category: originalProduct.category || '',
        suppliers: originalProduct.suppliers?.map(s => ({ id: s.id, name: s.name })) || [],
        supplierIds: originalProduct.suppliers?.map(s => s.id) || [],
        description: originalProduct.description || '',
        imageUrls: originalProduct.imageUrls || []
      };

      setState(prev => ({
        ...prev,
        formData,
        validation: initialValidation,
        hasChanges: false,
        isEditing: false,
        editingField: null
      }));
    }
  }, [originalProduct]);

  const addImage = useCallback(async (photo: any): Promise<boolean> => {
    // This will be implemented when we add media upload functionality
    return true;
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        imageUrls: prev.formData.imageUrls?.filter(url => url !== imageId) || []
      },
      hasChanges: true
    }));
  }, []);

  const uploadImages = useCallback(async (): Promise<boolean> => {
    // This will be implemented when we add media upload functionality
    return true;
  }, []);

  const actions: ProductEditActions = {
    setEditingField,
    updateFormData,
    validateField,
    saveChanges,
    resetForm,
    addImage,
    removeImage,
    uploadImages
  };

  return {
    state,
    actions,
    categories,
    suppliers,
    isLoadingCategories,
    isLoadingSuppliers
  };
};