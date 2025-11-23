import { getStatusColor as getImportStatusColor, getStatusLabel as getImportStatusLabel, TReceiptImportStatus } from './receipt-import.constant';
import { getStatusColor as getReturnStatusColor, getStatusLabel as getReturnStatusLabel, TReceiptReturnStatus } from './receipt-return.constant';
import { getStatusColor as getCheckStatusColor, getStatusLabel as getCheckStatusLabel, TReceiptCheckStatus } from './receipt-check.constant';
import { getStatusColor as getDebtStatusColor, getStatusLabel as getDebtStatusLabel, TReceiptDebtStatus } from './receipt-debt.constant';

export type ReceiptStatus =
  | TReceiptImportStatus
  | TReceiptReturnStatus
  | TReceiptCheckStatus
  | TReceiptDebtStatus
  | "unknown";


/**
 * Get status color for any receipt type
 * This is a unified function that handles all receipt types
 */
export const getStatusColor = (status: ReceiptStatus): string => {
  // Check each type-specific function by examining the status value
  // Since the status strings are unique across types, we check for valid return values
  const importColor = getImportStatusColor(status as TReceiptImportStatus);
  if (importColor !== "medium") return importColor;

  const returnColor = getReturnStatusColor(status as TReceiptReturnStatus);
  if (returnColor !== "medium") return returnColor;

  const checkColor = getCheckStatusColor(status as TReceiptCheckStatus);
  if (checkColor !== "medium") return checkColor;

  const debtColor = getDebtStatusColor(status as TReceiptDebtStatus);
  if (debtColor !== "medium") return debtColor;

  return "medium";
};

/**
 * Get status label for any receipt type
 * This is a unified function that handles all receipt types
 */
export const getStatusLabel = (status: ReceiptStatus): string => {
  // Check each type-specific function by examining the status value
  const importLabel = getImportStatusLabel(status as TReceiptImportStatus);
  if (importLabel !== "Unknown") return importLabel;

  const returnLabel = getReturnStatusLabel(status as TReceiptReturnStatus);
  if (returnLabel !== "Unknown") return returnLabel;

  const checkLabel = getCheckStatusLabel(status as TReceiptCheckStatus);
  if (checkLabel !== "Unknown") return checkLabel;

  const debtLabel = getDebtStatusLabel(status as TReceiptDebtStatus);
  if (debtLabel !== "Unknown") return debtLabel;

  return "Unknown";
};
