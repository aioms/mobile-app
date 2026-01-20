import { PaymentMethod } from "@/common/enums/order";

/**
 * Order item interface for managing product items in the order
 */
export interface IOrderItem {
  id: string;
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  sellingPrice: number;
  vatRate?: number;
  inventory?: number; // Add inventory for quantity constraints
  shipNow?: boolean; // Add shipNow flag for bypassing inventory validation
}

/**
 * Order item interface for API submission
 */
export interface IOrderItemSubmission {
  productId: string;
  productName: string;
  code: string;
  quantity: number;
  price: number;
  vatRate?: number;
  shipNow: boolean;
}

/**
 * Form data interface for order information
 */
export interface IFormData {
  code: string;
  status: string;
  note: string;
  customer: string;
  paymentMethod: PaymentMethod;
  vatEnabled: boolean;
  companyName?: string;
  taxCode?: string;
  email?: string;
  remark?: string;
  discountType?: "percentage" | "fixed";
  discountPercentage?: number;
  discountAmount?: number;
  discountAmountFormatted?: string;
}

/**
 * Props for OrderStatusHeader component
 */
export interface OrderStatusHeaderProps {
  status: string;
  orderCode: string;
}

/**
 * Props for OrderItemsSection component
 */
export interface OrderItemsSectionProps {
  orderItems: IOrderItem[];
  showDownArrow: boolean;
  onScanBarcode: () => void;
  onSearchProduct: () => void;
  onItemChange: (id: string, data: Partial<IOrderItem>) => void;
  onRemoveItem: (id: string) => void;
}

/**
 * Props for DiscountSection component
 */
export interface DiscountSectionProps {
  formData: Pick<IFormData, 'discountType' | 'discountPercentage' | 'discountAmount' | 'discountAmountFormatted'>;
  isEditMode: boolean;
  onDiscountChange: (e: any) => void;
  onDiscountTypeChange: (e: CustomEvent) => void;
}

/**
 * Props for OrderFormSection component
 */
export interface OrderFormSectionProps {
  formData: Pick<IFormData, 'customer' | 'paymentMethod'>;
  selectedCustomerName: string;
  isEditMode: boolean;
  errors: Record<string, string>;
  onPaymentMethodChange: (e: CustomEvent) => void;
  onOpenCustomerModal: () => void;
}

/**
 * Props for VATSection component
 */
export interface VATSectionProps {
  formData: Pick<IFormData, 'vatEnabled' | 'companyName' | 'taxCode' | 'email' | 'remark'>;
  isEditMode: boolean;
  errors: Record<string, string>;
  onVatToggle: (e: CustomEvent) => void;
  onInputChange: (e: any) => void;
  onTextAreaChange: (e: any) => void;
}

/**
 * Props for OrderNotesSection component
 */
export interface OrderNotesSectionProps {
  note: string;
  isEditMode: boolean;
  onTextAreaChange: (e: any) => void;
}

/**
 * Props for OrderSummarySection component
 */
export interface OrderSummarySectionProps {
  subtotal: number;
  discount: number;
  vatTotal: number;
  finalTotal: number;
}

/**
 * Props for OrderActionsSection component
 */
export interface OrderActionsSectionProps {
  orderStatus: string;
  isLoading: boolean;
  isEditMode: boolean;
  onCancel: () => Promise<void>;
  onSubmit: () => Promise<void>;
}

/**
 * Calculation functions interface
 */
export interface OrderCalculations {
  calculateTotal: () => number;
  calculateTotalVat: () => number;
  calculateDiscount: () => number;
  calculateFinalTotal: () => number;
}

/**
 * Order handlers interface
 */
export interface OrderHandlers {
  handleInputChange: (e: any) => void;
  handleDiscountChange: (e: any) => void;
  handleDiscountTypeChange: (e: CustomEvent) => void;
  handlePaymentMethodChange: (e: CustomEvent) => void;
  handleVatToggle: (e: CustomEvent) => void;
  handleTextAreaChange: (e: any) => void;
  handleItemChange: (id: string, data: Partial<IOrderItem>) => void;
  handleRemoveItem: (id: string) => void;
  handleCancel: () => Promise<void>;
  handleSubmit: () => Promise<void>;
}