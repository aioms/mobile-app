import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const dayjsFormat = (
  date?: string | Date,
  format?: string,
  locale?: string,
) => {
  if (!date) return "";

  let datetime;
  if (typeof date === "string") {
    if (date.includes("Z") || date.includes("+")) {
      datetime = dayjs(date).tz("Asia/Ho_Chi_Minh");
    } else if (date.includes("T") || date.includes(" ")) {
      datetime = dayjs.utc(date).tz("Asia/Ho_Chi_Minh");
    } else {
      datetime = dayjs(date);
    }
  } else {
    datetime = dayjs(date).tz("Asia/Ho_Chi_Minh");
  }

  if (locale) {
    datetime = datetime.locale(locale);
  }
  return datetime.format(format || "DD/MM/YYYY");
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

// Format currency input as user types (for real-time formatting)
export const formatCurrencyInput = (value: string): string => {
  const numericValue = parseCurrencyInput(value);
  return formatCurrencyWithoutSymbol(numericValue);
};

export const parseCurrencyInput = (value: string): number => {
  // Remove all non-digit characters and parse to number
  return parseInt(value.replace(/\D/g, "")) || 0;
};
