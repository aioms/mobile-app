import dayjs from "dayjs";

export const dayjsFormat = (date: string, format?: string) => {
  return dayjs(date).format(format || "DD/MM/YYYY");
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatCurrencyWithoutSymbol = (amount: number) => {
  if (!amount) return "0";
  return amount.toLocaleString("vi-VN", { currency: "VND" });
};