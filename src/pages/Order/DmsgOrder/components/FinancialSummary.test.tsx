// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import FinancialSummary from "./FinancialSummary";
import { calculateDmsgFinancials } from "@/helpers/dmsgFinancials";
vi.mock("@/components/UI", () => ({ AppCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
afterEach(cleanup);
describe("DMSG profit margin", () => {
  it("uses revenue after VAT and commission", () => {
    const value = calculateDmsgFinancials({ invoiceTotal: 108000000, totalCost: 70000000, vatRate: 8, commissionRate: 10, invoiceFee: 1000000 });
    render(<FinancialSummary value={value} draft />);
    expect(screen.getByText(/Biên lợi nhuận:/).textContent).toContain("21,90%");
  });
  it("shows negative margin and undefined zero-revenue margin", () => {
    const value = calculateDmsgFinancials({ invoiceTotal: 100, totalCost: 120, vatRate: 0, commissionRate: 0, invoiceFee: 0 });
    const { rerender } = render(<FinancialSummary value={value} draft />);
    expect(screen.getByText(/Biên lợi nhuận:/).textContent).toContain("-20,00%");
    rerender(<FinancialSummary value={{ ...value, revenue: 0 }} draft />);
    expect(screen.getByText(/Biên lợi nhuận:/).textContent).toContain("—");
  });
});
