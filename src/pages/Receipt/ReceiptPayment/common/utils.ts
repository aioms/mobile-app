import { ReceiptPaymentStatus, ReceiptPaymentExpenseType } from "@/common/enums/receipt";
import { 
  flash, 
  cube, 
  business, 
  documentText, 
  cash, 
  car, 
  people, 
  card,
  wallet
} from "ionicons/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const getPaymentReceiptStatusColor = (status: ReceiptPaymentStatus) => {
  switch (status) {
    case ReceiptPaymentStatus.PAID:
      return { bg: "bg-green-100", text: "text-green-700", label: "ĐÃ THANH TOÁN" };
    case ReceiptPaymentStatus.DEBT_PAYMENT:
      return { bg: "bg-blue-100", text: "text-blue-700", label: "CHI TRẢ NỢ" };
    case ReceiptPaymentStatus.CANCELLED:
      return { bg: "bg-red-100", text: "text-red-700", label: "ĐÃ HUỶ" };
    case ReceiptPaymentStatus.DRAFT:
      return { bg: "bg-gray-100", text: "text-gray-700", label: "NHÁP" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-700", label: "NHÁP" };
  }
};

export const getPaymentReceiptTypeIcon = (type: ReceiptPaymentExpenseType) => {
  switch (type) {
    case ReceiptPaymentExpenseType.SUPPLIER_PAYMENT:
      return { icon: card, color: "text-green-600", bg: "bg-green-50", label: "Thanh toán NCC" };
    case ReceiptPaymentExpenseType.TRANSPORTATION:
      return { icon: car, color: "text-blue-500", bg: "bg-blue-50", label: "Vận chuyển" };
    case ReceiptPaymentExpenseType.UTILITIES:
      return { icon: flash, color: "text-yellow-600", bg: "bg-yellow-50", label: "Điện nước" };
    case ReceiptPaymentExpenseType.RENT:
      return { icon: business, color: "text-indigo-500", bg: "bg-indigo-50", label: "Thuê nhà/mặt bằng" };
    case ReceiptPaymentExpenseType.LABOR:
      return { icon: people, color: "text-pink-600", bg: "bg-pink-50", label: "Nhân công" };
    case ReceiptPaymentExpenseType.CASH_WITHDRAWAL_SANG:
      return { icon: wallet, color: "text-teal-600", bg: "bg-teal-50", label: "Rút tiền mặt (Cô Sang)" };
    case ReceiptPaymentExpenseType.OTHER:
    default:
      return { icon: documentText, color: "text-gray-500", bg: "bg-gray-100", label: "Chi phí khác" };
  }
};

import { IReceiptPayment } from "@/types/receiptPayment.type";

export const EXPENSE_TYPE_LABELS: Record<ReceiptPaymentExpenseType, string> = {
  [ReceiptPaymentExpenseType.SUPPLIER_PAYMENT]: "Thanh toán NCC",
  [ReceiptPaymentExpenseType.TRANSPORTATION]: "Vận chuyển",
  [ReceiptPaymentExpenseType.UTILITIES]: "Điện nước",
  [ReceiptPaymentExpenseType.RENT]: "Thuê nhà/mặt bằng",
  [ReceiptPaymentExpenseType.LABOR]: "Nhân công",
  [ReceiptPaymentExpenseType.CASH_WITHDRAWAL_SANG]: "Rút tiền Cô Sang",
  [ReceiptPaymentExpenseType.OTHER]: "Khác",
};

export const mapBackendToReceiptPayment = (item: any): IReceiptPayment => {
  return {
    id: item.id,
    code: item.code,
    type: item.expenseType,
    title: item.expenseType === ReceiptPaymentExpenseType.OTHER && item.expenseTypeName
      ? item.expenseTypeName
      : EXPENSE_TYPE_LABELS[item.expenseType as ReceiptPaymentExpenseType] || "Chi phí",
    date: item.paymentDate
      ? (item.paymentDate.includes("T") || item.paymentDate.includes(" ") || item.paymentDate.includes("Z")
        ? dayjs(item.paymentDate).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD")
        : item.paymentDate)
      : "",
    subjectName: item.paymentObject || item.supplierName || "---",
    amount: Number(item.amount),
    status: item.status,
    paymentMethod: item.paymentMethod,
    isDirectExport: !!item.isDirectExport,
    note: item.notes || "",
    expenseTypeName: item.expenseTypeName,
    paymentDate: item.paymentDate,
    paymentObject: item.paymentObject,
    notes: item.notes,
    supplierId: item.supplierId,
    supplierName: item.supplierName,
    receiptImportIds: item.receiptImportIds,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    user: item.user,
    receiptImports: item.receiptImports,
  };
};



