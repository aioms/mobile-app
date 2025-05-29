import dayjs from "dayjs";

export const dayjsFormat = (date: string, format?: string) => {
  return dayjs(date).format(format || "DD/MM/YYYY");
};

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export const formatCurrencyWithoutSymbol = (amount: number) => {
  if (!amount) return "0";
  return amount.toLocaleString("vi-VN", { currency: "VND" });
};

export const parseCurrencyInput = (value: string): number => {
  // Remove all non-digit characters and parse to number
  return parseInt(value.replace(/\D/g, "")) || 0;
};
