/**
 * @deprecated This file has been separated into type-specific files for better organization.
 * Please import from the following files instead:
 * - @/common/constants/receipt-import.constant for import receipts
 * - @/common/constants/receipt-return.constant for return receipts
 * - @/common/constants/receipt-check.constant for check receipts
 * - @/common/constants/receipt-debt.constant for debt receipts
 * - @/common/constants/receipt-status-helper for unified status functions
 *
 * This file is maintained for backward compatibility but will be removed in a future version.
 */

// Re-export from type-specific files for backward compatibility
export {
  RECEIPT_IMPORT_STATUS,
  getStatusColor as getImportStatusColor,
  getStatusLabel as getImportStatusLabel,
} from './receipt-import.constant';
export type { TReceiptImportStatus } from './receipt-import.constant';

export {
  RECEIPT_RETURN_STATUS,
  getStatusColor as getReturnStatusColor,
  getStatusLabel as getReturnStatusLabel,
} from './receipt-return.constant';
export type { TReceiptReturnStatus } from './receipt-return.constant';

export {
  RECEIPT_CHECK_STATUS,
  RECEIPT_CHECK_REASONS,
  getStatusColor as getCheckStatusColor,
  getStatusLabel as getCheckStatusLabel,
} from './receipt-check.constant';
export type { TReceiptCheckStatus } from './receipt-check.constant';

export {
  RECEIPT_DEBT_STATUS,
  getStatusColor as getDebtStatusColor,
  getStatusLabel as getDebtStatusLabel,
} from './receipt-debt.constant';
export type { TReceiptDebtStatus } from './receipt-debt.constant';

export {
  getStatusColor,
  getStatusLabel,
} from './receipt-status-helper';
export type { ReceiptStatus } from './receipt-status-helper';