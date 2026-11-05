// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CashSourcesEditor from "./CashSourcesEditor";

const mockUpdateCashForDay = vi.fn().mockResolvedValue({});
vi.mock("@/hooks/apis/useCashbook", () => ({
  default: () => ({
    updateCashForDay: mockUpdateCashForDay,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CashSourcesEditor Component", () => {
  it("renders single-line view mode matching Chi phí list when not editing", () => {
    const sources = [{ name: "Cô 2", amount: 1000000 }];
    render(
      <CashSourcesEditor
        date="2026-11-05"
        sources={sources}
        isEditing={false}
        onSaved={vi.fn()}
      />
    );

    // Shows source name and formatted amount (1.000.000)
    expect(screen.getByText("Cô 2")).toBeDefined();
    expect(screen.getByText("1.000.000")).toBeDefined();

    // Does not render bulky edit inputs in view mode
    expect(screen.queryByPlaceholderText("VD: Cô 2, Tiền mang về...")).toBeNull();
  });

  it("renders input with white background and formats currency to 1.000.000 in edit mode", () => {
    const sources = [{ name: "Cô 2", amount: 1000000 }];
    render(
      <CashSourcesEditor
        date="2026-11-05"
        sources={sources}
        isEditing={true}
        onSaved={vi.fn()}
      />
    );

    const nameInput = screen.getByDisplayValue("Cô 2") as HTMLInputElement;
    const amountInput = screen.getByDisplayValue("1.000.000") as HTMLInputElement;

    // Verify background color is explicitly white and text is dark (preventing black input bug)
    expect(nameInput.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(amountInput.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(nameInput.className).toContain("bg-white");
    expect(amountInput.className).toContain("bg-white");

    // Type new amount into input
    fireEvent.change(amountInput, { target: { value: "2500000" } });
    expect(amountInput.value).toBe("2.500.000");
  });

  it("switches back to compact view after saving", async () => {
    const onSaved = vi.fn().mockResolvedValue(undefined);
    const onToggleEdit = vi.fn();
    const sources = [{ name: "Cô 2", amount: 1000000 }];

    render(
      <CashSourcesEditor
        date="2026-11-05"
        sources={sources}
        isEditing={true}
        onToggleEdit={onToggleEdit}
        onSaved={onSaved}
      />
    );

    const saveButton = screen.getByText("Lưu nguồn tiền");
    fireEvent.click(saveButton);

    // Wait for save and onSaved to be called
    await vi.waitFor(() => {
      expect(mockUpdateCashForDay).toHaveBeenCalledWith({
        date: "2026-11-05",
        cashForDay: 1000000,
        cashSources: [{ name: "Cô 2", amount: 1000000 }],
      });
      expect(onSaved).toHaveBeenCalled();
      expect(onToggleEdit).toHaveBeenCalledWith(false);
    });
  });
});
