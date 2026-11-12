// @vitest-environment jsdom
import { useState, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DmsgAttachment } from "@/types/dmsg.type";
import Attachments from "./Attachments";

const api = vi.hoisted(() => ({ upload: vi.fn(), download: vi.fn() }));
vi.mock("@/hooks/apis/useDmsgOrder", () => ({ default: () => api }));
vi.mock("@/components/UI", () => ({
  AppCard: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
const saved: DmsgAttachment = { fileId: "saved", kind: "cost_image" };
const pending: DmsgAttachment = { fileId: "pending", kind: "invoice_pdf" };
const props = { orderId: "order", disabled: false, onBusy: vi.fn(), onChange: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  api.download.mockResolvedValue({ name: "saved.jpg", url: "https://example.com/saved.jpg" });
});
afterEach(cleanup);

describe("DMSG attachment persistence", () => {
  it("uploads a file without requesting an order download before save", async () => {
    api.upload.mockResolvedValue("pending");
    function Editor() {
      const [value, setValue] = useState<DmsgAttachment[]>([saved]);
      return <Attachments {...props} value={value} savedValue={[saved]} onChange={setValue} />;
    }
    render(<Editor />);
    await screen.findByText("saved.jpg");
    fireEvent.change(screen.getByLabelText("PDF hóa đơn đã xuất"), {
      target: { files: [new File(["invoice"], "invoice.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("invoice.pdf");
    expect(screen.getByText("Chưa lưu")).toBeTruthy();
    expect(api.upload).toHaveBeenCalledTimes(1);
    expect(api.download.mock.calls.every(([, id]) => id === "saved")).toBe(true);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("asks to save a pending file without opening a tab or requesting download", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<Attachments {...props} value={[pending]} savedValue={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Hóa đơn 1" }));
    expect(screen.getByRole("alert").textContent).toContain("Lưu đơn");
    expect(api.download).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("loads metadata after save even when attachment IDs stay unchanged", async () => {
    const { rerender } = render(<Attachments {...props} value={[pending]} savedValue={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "Hóa đơn 1" }));
    rerender(<Attachments {...props} value={[pending]} savedValue={[pending]} />);
    await waitFor(() => expect(api.download).toHaveBeenCalledWith("order", "pending"));
    expect(screen.queryByText("Chưa lưu")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("keeps real download errors visible for saved documents", async () => {
    api.download.mockRejectedValue(new Error("Không tải được tệp"));
    render(<Attachments {...props} value={[saved]} savedValue={[saved]} />);
    expect((await screen.findByRole("alert")).textContent).toBe("Không tải được tệp");
  });

  it("opens image fullscreen preview when clicking cost image thumbnail or button", async () => {
    render(<Attachments {...props} value={[saved]} savedValue={[saved]} />);
    const button = await screen.findByRole("button", { name: "saved.jpg" });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByAltText("Preview 1")).toBeTruthy();
    });
    const modal = document.querySelector("ion-modal.image-preview-modal");
    expect(modal?.getAttribute("is-open")).toBe("true");
  });
});
