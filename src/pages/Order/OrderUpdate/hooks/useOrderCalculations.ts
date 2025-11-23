import { useMemo } from "react";
import { IOrderItem, IFormData } from "../components/orderUpdate.d";

/**
 * Custom hook for order calculations with memoization
 * Extracts calculation logic from the main component for better performance
 */
export const useOrderCalculations = (
  orderItems: IOrderItem[],
  formData: IFormData
) => {
  // Calculate subtotal (before discount and VAT)
  const subtotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      return total + (item.quantity * item.sellingPrice);
    }, 0);
  }, [orderItems]);

  // Calculate total VAT amount
  const totalVat = useMemo(() => {
    if (!formData.vatEnabled) return 0;
    
    return orderItems.reduce((total, item) => {
      const itemTotal = item.quantity * item.sellingPrice;
      const vatRate = item.vatRate || 0.1; // Default 10% VAT
      return total + (itemTotal * vatRate);
    }, 0);
  }, [orderItems, formData.vatEnabled]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (formData.discountType === "percentage") {
      return subtotal * ((formData.discountPercentage || 0) / 100);
    } else {
      return formData.discountAmount || 0;
    }
  }, [subtotal, formData.discountType, formData.discountPercentage, formData.discountAmount]);

  // Calculate final total
  const finalTotal = useMemo(() => {
    return subtotal - discountAmount + totalVat;
  }, [subtotal, discountAmount, totalVat]);

  return {
    subtotal,
    totalVat,
    discountAmount,
    finalTotal,
  };
};