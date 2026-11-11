// @vitest-environment jsdom
import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import FinancialSummary from "./FinancialSummary";
import { calculateDmsgFinancials } from "@/helpers/dmsgFinancials";
vi.mock("@/components/UI", () => ({
  AppCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AppBadge: ({ children, color, className }: { children: React.ReactNode; color?: string; className?: string }) => (
    <span data-testid="badge" data-color={color} className={className}>
      {children}
    </span>
  ),
}));
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
  it("renders status badge with danger color when cancelled", () => {
    const value = calculateDmsgFinancials({ invoiceTotal: 100, totalCost: 80, vatRate: 0, commissionRate: 0, invoiceFee: 0 });
    const { rerender } = render(<FinancialSummary value={value} draft={false} stateLabel="Đã hủy" />);
    const badge = screen.getByTestId("badge");
    expect(badge.textContent).toBe("Đã hủy");
    expect(badge.getAttribute("data-color")).toBe("danger");

    rerender(<FinancialSummary value={value} draft={false} stateLabel="Chưa lưu" />);
    expect(screen.getByTestId("badge").getAttribute("data-color")).toBe("warning");

    rerender(<FinancialSummary value={value} draft={true} />);
    expect(screen.getByTestId("badge").getAttribute("data-color")).toBe("primary");

    rerender(<FinancialSummary value={value} draft={false} />);
    expect(screen.getByTestId("badge").getAttribute("data-color")).toBe("success");
  });
});
