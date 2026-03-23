import { ISupplier } from "@/types/supplier";

export interface ISupplierDetail extends ISupplier {
  email?: string;
  company?: string;
  totalOrders?: number;
  totalReceiptCheck?: number;
}
