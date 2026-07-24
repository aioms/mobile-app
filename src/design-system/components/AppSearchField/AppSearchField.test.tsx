import React, { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSearchField } from "./AppSearchField";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppSearchField", () => {
  it("uses the published default accessible label", () => {
    render(<AppSearchField value="" onValueChange={vi.fn()} />);

    expect(screen.getByRole("searchbox", { name: "Tìm kiếm" })).toBeVisible();
  });

  it("emits controlled typing immediately without owning debounce", () => {
    const onValueChange = vi.fn();

    render(<AppSearchField value="" onValueChange={onValueChange} />);
    const input = screen.getByRole("searchbox", { name: "Tìm kiếm" });

    fireEvent.change(input, { target: { value: "n" } });
    expect(onValueChange).toHaveBeenLastCalledWith("n");
    fireEvent.change(input, { target: { value: "nh" } });
    expect(onValueChange).toHaveBeenLastCalledWith("nh");
    fireEvent.change(input, { target: { value: "nhập" } });

    expect(onValueChange.mock.calls).toEqual([["n"], ["nh"], ["nhập"]]);
  });

  it("shows clear only for non-empty values and restores input focus", () => {
    const onClear = vi.fn();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <AppSearchField
        value=""
        onValueChange={onValueChange}
        onClear={onClear}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /xóa/i }),
    ).not.toBeInTheDocument();

    rerender(
      <AppSearchField
        value="công nợ"
        onValueChange={onValueChange}
        onClear={onClear}
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Tìm kiếm" });
    const clearButton = screen.getByRole("button", { name: /xóa/i });

    input.focus();
    fireEvent.click(clearButton);

    expect(onValueChange).toHaveBeenCalledWith("");
    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveFocus();
  });

  it("announces loading without blocking continued typing", () => {
    const onValueChange = vi.fn();

    render(
      <AppSearchField
        value="đơn"
        loading
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Tìm kiếm" });

    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
    expect(input).not.toBeDisabled();

    fireEvent.change(input, { target: { value: "đơn hàng" } });
    expect(onValueChange).toHaveBeenCalledWith("đơn hàng");
  });

  it("forwards its native ref and events", () => {
    const ref = createRef<HTMLInputElement>();
    const onFocus = vi.fn();
    const onKeyDown = vi.fn();

    render(
      <AppSearchField
        ref={ref}
        label="Tìm sản phẩm"
        value=""
        onValueChange={vi.fn()}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
      />,
    );
    const input = screen.getByRole("searchbox", { name: "Tìm sản phẩm" });

    expect(ref.current).toBe(input);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onFocus).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it("does not fetch results as an input-side effect", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(<AppSearchField value="" onValueChange={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "nhà cung cấp" },
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
