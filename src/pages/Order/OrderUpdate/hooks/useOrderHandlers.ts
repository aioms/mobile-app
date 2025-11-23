import { useCallback } from "react";
import { IOrderItem, IFormData } from "../components/orderUpdate.d";
import { PaymentMethod } from "@/common/enums/order";
import { parseCurrencyInput } from "@/helpers/formatters";

interface UseOrderHandlersProps {
  formData: IFormData;
  setFormData: React.Dispatch<React.SetStateAction<IFormData>>;
  orderItems: IOrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<IOrderItem[]>>;
  setIsCustomerModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * Custom hook for order event handlers with memoization
 * Extracts handler logic from the main component for better performance
 */
export const useOrderHandlers = ({
  setFormData,
  setOrderItems,
  setIsCustomerModalOpen,
}: UseOrderHandlersProps) => {
  
  // Handle general input changes
  const handleInputChange = useCallback((field: keyof IFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, [setFormData]);

  // Handle discount percentage change
  const handleDiscountChange = useCallback((value: number) => {
    setFormData(prev => ({
      ...prev,
      discountPercentage: value,
    }));
  }, [setFormData]);

  // Handle discount type change
  const handleDiscountTypeChange = useCallback((type: "percentage" | "fixed") => {
    setFormData(prev => ({
      ...prev,
      discountType: type,
      discountPercentage: type === "percentage" ? prev.discountPercentage : 0,
      discountAmount: type === "fixed" ? prev.discountAmount : 0,
    }));
  }, [setFormData]);

  // Handle payment method change
  const handlePaymentMethodChange = useCallback((method: PaymentMethod) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method,
    }));
  }, [setFormData]);

  // Handle VAT toggle
  const handleVatToggle = useCallback((enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      vatEnabled: enabled,
    }));
  }, [setFormData]);

  // Handle textarea changes
  const handleTextAreaChange = useCallback((field: keyof IFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, [setFormData]);

  // Handle order item changes
  const handleItemChange = useCallback((id: string, data: Partial<IOrderItem>) => {
    setOrderItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...data } : item
      )
    );
  }, [setOrderItems]);

  // Handle item removal
  const handleRemoveItem = useCallback((id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  }, [setOrderItems]);

  // Handle customer modal opening
  const openModalSelectCustomer = useCallback(() => {
    setIsCustomerModalOpen(true);
  }, [setIsCustomerModalOpen]);

  // Handle discount amount change (for fixed discount)
  const handleDiscountAmountChange = useCallback((value: string) => {
    const numericValue = parseCurrencyInput(value);
    setFormData(prev => ({
      ...prev,
      discountAmount: numericValue,
      discountAmountFormatted: value,
    }));
  }, [setFormData]);

  return {
    handleInputChange,
    handleDiscountChange,
    handleDiscountTypeChange,
    handlePaymentMethodChange,
    handleVatToggle,
    handleTextAreaChange,
    handleItemChange,
    handleRemoveItem,
    openModalSelectCustomer,
    handleDiscountAmountChange,
  };
};