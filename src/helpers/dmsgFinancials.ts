import type { DmsgFinancials, DmsgInput } from "@/types/dmsg.type";

function divideRounded(amount: number, rate: number): number {
  const denominator = 10000 + Math.round(rate * 100);
  // Long division keeps intermediate integers small, including on older browsers.
  let remainder = 0;
  let quotient = "";
  for (const digit of `${amount}0000`) {
    remainder = remainder * 10 + Number(digit);
    quotient += Math.floor(remainder / denominator);
    remainder %= denominator;
  }
  return Number(quotient) + (remainder * 2 >= denominator ? 1 : 0);
}

/** Whole-VND snapshots; rates allow two decimals. Fee never reduces customer payout. */
export function calculateDmsgFinancials(input: DmsgInput): DmsgFinancials {
  for (const value of [input.invoiceTotal, input.totalCost, input.invoiceFee]) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Số tiền phải là số nguyên VND không âm");
    }
  }
  for (const rate of [input.vatRate, input.commissionRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 100 ||
      Math.abs(rate * 100 - Math.round(rate * 100)) > 0.000001) {
      throw new Error("Tỷ lệ từ 0 đến 100%, tối đa 2 chữ số thập phân");
    }
  }
  const beforeVat = divideRounded(input.invoiceTotal, input.vatRate);
  const revenue = divideRounded(beforeVat, input.commissionRate);
  const profit = revenue - input.totalCost - input.invoiceFee;
  if (!Number.isSafeInteger(profit)) throw new Error("Số tiền vượt giới hạn");
  return {
    ...input,
    formulaVersion: 1,
    beforeVat,
    vatAmount: input.invoiceTotal - beforeVat,
    revenue,
    commissionAmount: beforeVat - revenue,
    customerTransfer: beforeVat - revenue,
    profit,
  };
}
