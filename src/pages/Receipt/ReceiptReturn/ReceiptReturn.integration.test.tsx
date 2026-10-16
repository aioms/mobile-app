// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { configure, render, screen, fireEvent, cleanup } from "@testing-library/react";
import ReturnPartnerSection from "./components/ReturnPartnerSection";
import ReturnReasonSelect from "./components/ReturnReasonSelect";
import ProductReturnItem from "./components/ProductReturnItem";
import RefundSummarySection from "./components/RefundSummarySection";
import ExchangeProductSection from "./components/ExchangeProductSection";
import { ReceiptReturnType } from "@/types/receipt-return.type";

afterEach(() => {
  cleanup();
});

configure({ testIdAttribute: "data-cy" });

describe("ReturnPartnerSection Integration", () => {
  it("renders customer details and switches partner type", () => {
    const handleTypeChange = vi.fn();
    const handleSelectCustomer = vi.fn();
    const handleSelectOrder = vi.fn();
    const handleClearOrder = vi.fn();

    render(
      <ReturnPartnerSection
        type={ReceiptReturnType.CUSTOMER}
        isFixedRoute={false}
        isDebt={false}
        customerName="Khách hàng VIP"
        supplierName="Chọn nhà cung cấp"
        selectedOrderCode=""
        onTypeChange={handleTypeChange}
        onSelectOrder={handleSelectOrder}
        onClearOrder={handleClearOrder}
        onSelectCustomer={handleSelectCustomer}
        onSelectSupplier={vi.fn()}
      />,
    );

    expect(screen.getByText("Khách hàng VIP")).toBeDefined();
    expect(screen.getByTestId("return-type-customer")).toBeDefined();
    expect(screen.getByTestId("return-type-supplier")).toBeDefined();

    // Click select customer
    fireEvent.click(screen.getByTestId("return-select-customer-btn"));
    expect(handleSelectCustomer).toHaveBeenCalledTimes(1);

    // Click select order
    fireEvent.click(screen.getByTestId("return-select-order-btn"));
    expect(handleSelectOrder).toHaveBeenCalledTimes(1);

    // Switch to supplier
    fireEvent.click(screen.getByTestId("return-type-supplier"));
    expect(handleTypeChange).toHaveBeenCalledWith(ReceiptReturnType.SUPPLIER);
  });

  it("renders linked order code and can clear order", () => {
    const handleClearOrder = vi.fn();

    render(
      <ReturnPartnerSection
        type={ReceiptReturnType.CUSTOMER}
        isFixedRoute={false}
        isDebt={false}
        customerName="Khách lẻ"
        supplierName="Chọn nhà cung cấp"
        selectedOrderCode="ORD-12345"
        refId="order-uuid-12345"
        refType="order"
        onTypeChange={vi.fn()}
        onSelectOrder={vi.fn()}
        onClearOrder={handleClearOrder}
        onSelectCustomer={vi.fn()}
        onSelectSupplier={vi.fn()}
      />,
    );

    expect(screen.getByText("#ORD-12345")).toBeDefined();
    const clearBtn = screen.getByTestId("return-clear-order-btn");
    fireEvent.click(clearBtn);
    expect(handleClearOrder).toHaveBeenCalledTimes(1);
  });

  it("renders supplier info and select supplier button", () => {
    const handleSelectSupplier = vi.fn();

    render(
      <ReturnPartnerSection
        type={ReceiptReturnType.SUPPLIER}
        isFixedRoute={false}
        isDebt={false}
        customerName="Khách lẻ"
        supplierName="Công ty May Mặc Á Châu"
        selectedOrderCode=""
        errorSupplier="Vui lòng chọn nhà cung cấp"
        onTypeChange={vi.fn()}
        onSelectOrder={vi.fn()}
        onClearOrder={vi.fn()}
        onSelectCustomer={vi.fn()}
        onSelectSupplier={handleSelectSupplier}
      />,
    );

    expect(screen.getByText("Công ty May Mặc Á Châu")).toBeDefined();
    expect(screen.getByText("Vui lòng chọn nhà cung cấp")).toBeDefined();

    const selectSupBtn = screen.getByTestId("return-select-supplier-btn");
    fireEvent.click(selectSupBtn);
    expect(handleSelectSupplier).toHaveBeenCalledTimes(1);
  });
});

describe("ReturnReasonSelect Integration", () => {
  it("renders custom reason input when 'Lý do khác' is selected", () => {
    const handleChange = vi.fn();
    const handleCustomReasonChange = vi.fn();

    const { rerender } = render(
      <ReturnReasonSelect
        type={ReceiptReturnType.CUSTOMER}
        value="Sản phẩm lỗi"
        onChange={handleChange}
        customReason=""
        onCustomReasonChange={handleCustomReasonChange}
      />,
    );

    expect(screen.queryByTestId("custom-return-reason")).toBeNull();

    // Rerender with 'Lý do khác'
    rerender(
      <ReturnReasonSelect
        type={ReceiptReturnType.CUSTOMER}
        value="Lý do khác"
        onChange={handleChange}
        customReason="Khách đổi ý muốn mua màu khác"
        onCustomReasonChange={handleCustomReasonChange}
      />,
    );

    const customInput = screen.getByTestId("custom-return-reason") as HTMLInputElement;
    expect(customInput).toBeDefined();
    expect(customInput.value).toBe("Khách đổi ý muốn mua màu khác");

    fireEvent.change(customInput, { target: { value: "Khách trả quà tặng" } });
    expect(handleCustomReasonChange).toHaveBeenCalledWith("Khách trả quà tặng");
  });
});

describe("ProductReturnItem Integration", () => {
  it("increments and decrements quantity and updates subtotal", () => {
    const handleQuantityChange = vi.fn();
    const handleRemove = vi.fn();

    render(
      <ProductReturnItem
        id="item-01"
        productName="Váy hoa vintage"
        code="VAY01"
        quantity={2}
        costPrice={150000}
        originalQuantity={5}
        onQuantityChange={handleQuantityChange}
        onRemove={handleRemove}
      />,
    );

    expect(screen.getByText("Váy hoa vintage")).toBeDefined();
    expect(screen.getByText(/300\.000/)).toBeDefined();

    // Click plus button: 2 -> 3
    const plusBtn = screen.getByLabelText("Tăng số lượng");
    fireEvent.click(plusBtn);
    expect(handleQuantityChange).toHaveBeenCalledWith("item-01", 3);

    // Click minus button: 3 -> 2
    const minusBtn = screen.getByLabelText("Giảm số lượng");
    fireEvent.click(minusBtn);
    expect(handleQuantityChange).toHaveBeenCalledWith("item-01", 2);

    // Click minus button again: 2 -> 1
    fireEvent.click(minusBtn);
    expect(handleQuantityChange).toHaveBeenCalledWith("item-01", 1);

    // Direct input
    const input = screen.getByTestId("return-quantity") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "4" } });
    expect(handleQuantityChange).toHaveBeenCalledWith("item-01", 4);

    // Remove button
    const removeBtn = screen.getByLabelText("Xóa Váy hoa vintage");
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith("item-01");
  });

  it("validates maximum quantity exceeding original quantity", () => {
    render(
      <ProductReturnItem
        id="item-02"
        productName="Giày sneaker trắng"
        code="GIAY02"
        quantity={1}
        costPrice={500000}
        originalQuantity={2}
        onQuantityChange={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const input = screen.getByTestId("return-quantity");
    fireEvent.change(input, { target: { value: "10" } });

    expect(screen.getByText("Số lượng tối đa là 2")).toBeDefined();
  });
});

describe("RefundSummarySection Integration", () => {
  it("renders pure return refund amounts correctly", () => {
    render(
      <RefundSummarySection
        totalProduct={3}
        totalQuantity={7}
        totalAmount={1050000}
        isDebt={false}
      />,
    );

    expect(screen.getByText(/Tổng số mặt hàng/)).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();
    expect(screen.getByText(/1\.050\.000/)).toBeDefined();
  });
});

describe("ExchangeProductSection Integration", () => {
  it("renders settlement difference for customer exchange", () => {
    const handlePreserveVat = vi.fn();
    render(
      <ExchangeProductSection
        isExchange={true}
        isDebt={false}
        preserveVat={true}
        setPreserveVat={handlePreserveVat}
        exchangeProducts={[
          {
            id: "ex-01",
            productName: "Hàng đổi mới",
            productCode: 101,
            unitPrice: 200000,
            costPrice: 150000,
            quantity: 1,
            inventory: 10,
            vatRate: 8,
          } as unknown as any,
        ]}
        errors={{}}
        openModalSelectExchangeProduct={vi.fn()}
        updateExchangeProduct={vi.fn()}
        removeExchangeProduct={vi.fn()}
        totalAmount={150000}
        exchangeAmount={200000}
        exchangeDifference={50000}
      />,
    );

    expect(screen.getByText("Đối soát chênh lệch")).toBeDefined();
    expect(screen.getByText("Khách cần bù thêm")).toBeDefined();
    expect(screen.getByTestId("exchange-difference").textContent).toContain("+50.000");

    // Toggle preserve vat checkbox
    const vatCheckbox = screen.getByTestId("exchange-preserve-vat");
    fireEvent.click(vatCheckbox);
    expect(handlePreserveVat).toHaveBeenCalled();
  });
});
