import { CameraPhoto } from '@/hooks/useCamera';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ProductImage {
  id: string;
  path: string;
}

export interface ProductEditFormData {
  productName: string;
  category: string;
  suppliers: Supplier[];
  supplierIds?: string[];
  description: string;
  imageUrls?: string[];
}

export interface ProductEditValidation {
  productName: string;
  category: string;
  suppliers: string;
  description: string;
  images: string;
}

export interface MediaUploadState {
  isUploading: boolean;
  uploadProgress: number;
  uploadedImages: UploadedImage[];
  error: string | null;
}

export interface UploadedImage {
  id: string;
  url: string;
  fileName: string;
  size: number;
  uploadedAt: Date;
  isTemporary?: boolean;
}

export interface ImageUploadOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxImages?: number;
  quality?: number;
}

export interface ProductEditState {
  isEditing: boolean;
  editingField: string | null;
  formData: ProductEditFormData;
  validation: ProductEditValidation;
  mediaUpload: MediaUploadState;
  isSaving: boolean;
  hasChanges: boolean;
}

export interface ProductEditActions {
  setEditingField: (field: string | null) => void;
  updateFormData: (field: keyof ProductEditFormData, value: any) => void;
  validateField: (field: keyof ProductEditFormData, value: any) => string;
  saveChanges: () => Promise<boolean>;
  resetForm: () => void;
  addImage: (photo: CameraPhoto) => Promise<boolean>;
  removeImage: (imageId: string) => void;
  uploadImages: () => Promise<boolean>;
}

export interface UseProductEdit {
  state: ProductEditState;
  actions: ProductEditActions;
  categories: Category[];
  suppliers: Supplier[];
  isLoadingCategories: boolean;
  isLoadingSuppliers: boolean;
}

// Form field types for better type safety
export type ProductEditField = keyof ProductEditFormData;
export type ValidationField = keyof ProductEditValidation;

// API response types
export interface CategoryResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
}

export interface SupplierResponse {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export interface ImageUploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

// Constants for validation
export const VALIDATION_RULES = {
  PRODUCT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    REQUIRED: true
  },
  CATEGORY: {
    REQUIRED: true
  },
  SUPPLIERS: {
    MIN_COUNT: 0,
    MAX_COUNT: 10
  },
  DESCRIPTION: {
    MAX_LENGTH: 500
  },
  IMAGES: {
    MAX_COUNT: 5,
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  }
} as const;