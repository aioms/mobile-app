import React, { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppTextField } from "./AppTextField";

describe("AppTextField", () => {
  it("renders a visible label and controlled value", () => {
    const onValueChange = vi.fn();

    render(
      <AppTextField
        label="Tên khách hàng"
        value="Nguyễn Văn An"
        onValueChange={onValueChange}
        placeholder="Không thay thế nhãn"
      />,
    );

    expect(screen.getByText("Tên khách hàng")).toBeVisible();
    expect(screen.getByLabelText("Tên khách hàng")).toHaveValue(
      "Nguyễn Văn An",
    );
  });

  it("emits the next controlled value immediately", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <AppTextField
        label="Mã số thuế"
        value=""
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByLabelText("Mã số thuế");

    fireEvent.change(input, { target: { value: "0312345678" } });
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("0312345678");

    rerender(
      <AppTextField
        label="Mã số thuế"
        value="0312345678"
        onValueChange={onValueChange}
      />,
    );
    expect(input).toHaveValue("0312345678");
  });

  it("links helper copy to the native input", () => {
    render(
      <AppTextField
        label="Email"
        value=""
        helperText="Dùng để nhận hóa đơn điện tử"
        onValueChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Email");
    const describedBy = input.getAttribute("aria-describedby");

    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Dùng để nhận hóa đơn điện tử",
    );
    expect(input).not.toHaveAttribute("aria-invalid", "true");
  });

  it("links error copy and exposes invalid state", () => {
    render(
      <AppTextField
        label="Số điện thoại"
        value="abc"
        state="error"
        errorText="Số điện thoại không hợp lệ"
        onValueChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Số điện thoại");
    const describedBy = input.getAttribute("aria-describedby");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? "")).toHaveTextContent(
      "Số điện thoại không hợp lệ",
    );
  });

  it("forwards native keyboard and autofill attributes", () => {
    render(
      <AppTextField
        label="Số tiền"
        value=""
        onValueChange={vi.fn()}
        autoComplete="transaction-amount"
        enterKeyHint="done"
        inputMode="decimal"
        name="amount"
        required
      />,
    );
    const input = screen.getByLabelText("Số tiền");

    expect(input).toHaveAttribute("autocomplete", "transaction-amount");
    expect(input).toHaveAttribute("enterkeyhint", "done");
    expect(input).toHaveAttribute("inputmode", "decimal");
    expect(input).toHaveAttribute("name", "amount");
    expect(input).toBeRequired();
  });

  it("renders a composition-owned trailing action", () => {
    const onAction = vi.fn();

    render(
      <AppTextField
        label="Mã sản phẩm"
        value="SP-001"
        onValueChange={vi.fn()}
        trailingAction={
          <button type="button" onClick={onAction}>
            Quét mã
          </button>
        }
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quét mã" }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("forwards its native ref and input events", () => {
    const ref = createRef<HTMLInputElement>();
    const onFocus = vi.fn();
    const onInput = vi.fn();

    render(
      <AppTextField
        ref={ref}
        label="Ghi chú"
        value=""
        onValueChange={vi.fn()}
        onFocus={onFocus}
        onInput={onInput}
      />,
    );
    const input = screen.getByLabelText("Ghi chú");

    expect(ref.current).toBe(input);
    fireEvent.focus(input);
    fireEvent.input(input, { target: { value: "Nội dung" } });
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onInput).toHaveBeenCalledOnce();
  });
});
