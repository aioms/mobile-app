import { TReceiptImportStatus } from "@/common/constants/receipt-import.constant";

export interface ReceiptImportFilterValues {
  suppliers: string[];
  status: TReceiptImportStatus[];
  dateRange: {
    from: string | null;
    to: string | null;
  };
}

export interface Supplier {
  id: string;
  name: string;
}

export interface ReceiptImportFilterModalProps {
  dismiss: (data?: ReceiptImportFilterValues, role?: string) => void;
  initialFilters: ReceiptImportFilterValues;
}

export const defaultReceiptImportFilters: ReceiptImportFilterValues = {
  suppliers: [],
  status: [],
  dateRange: { from: null, to: null },
};