import { describe, expect, it } from "vitest";
import { calculateDmsgFinancials } from "./dmsgFinancials";
describe("ĐMSG financial contract", () => {
  it("matches backend whole VND fixture and fee never changes payout", () => {
    const input = { invoiceTotal: 108000000, totalCost: 70000000, vatRate: 8, commissionRate: 10, invoiceFee: 1000000 };
    const value = calculateDmsgFinancials(input);
    expect(value.revenue).toBe(90909091); expect(value.customerTransfer).toBe(9090909); expect(value.profit).toBe(19909091);
    expect(calculateDmsgFinancials({ ...input, invoiceFee: 0 }).customerTransfer).toBe(value.customerTransfer);
  });
});
