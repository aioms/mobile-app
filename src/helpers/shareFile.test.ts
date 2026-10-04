// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  native: vi.fn(),
  write: vi.fn(),
  share: vi.fn(),
}));
vi.mock(
  "@capacitor/core",
  () => ({ Capacitor: { isNativePlatform: mocks.native } }),
);
vi.mock(
  "@capacitor/filesystem",
  () => ({
    Filesystem: { writeFile: mocks.write },
    Directory: { Cache: "CACHE" },
  }),
);
vi.mock("@capacitor/share", () => ({ Share: { share: mocks.share } }));
import { shareOrDownload, shareOrDownloadFiles } from "./shareFile";

describe("native order document delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.native.mockReturnValue(true);
    mocks.write.mockImplementation(async ({ path }: { path: string }) => ({
      uri: `file:///cache/${path}`,
    }));
    mocks.share.mockResolvedValue({ activityType: "" });
  });
  for (
    const [name, mime] of [["bill.pdf", "application/pdf"], [
      "quote.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ], ["bill.png", "image/png"]]
  ) {
    it(`writes ${name} into cache and passes native URI to Share`, async () => {
      await shareOrDownload(
        new Blob(["file bytes"], { type: mime }),
        name,
        mime,
        "Chia sẻ đơn hàng",
      );
      expect(mocks.write).toHaveBeenCalledWith({
        path: name,
        data: "ZmlsZSBieXRlcw==",
        directory: "CACHE",
      });
      expect(mocks.share).toHaveBeenCalledWith({
        title: name,
        url: `file:///cache/${name}`,
        dialogTitle: "Chia sẻ đơn hàng",
      });
    });
  }
  it("shares multiple PNG pages in one sheet", async () => {
    await shareOrDownloadFiles(
      [1, 2].map((index) => ({
        data: new Blob(["image"]),
        fileName: `page-${index}.png`,
      })),
      "Chia sẻ đơn hàng",
    );
    expect(mocks.share).toHaveBeenCalledTimes(1);
    expect(mocks.share.mock.calls[0][0].files).toEqual([
      "file:///cache/page-1.png",
      "file:///cache/page-2.png",
    ]);
  });
  it("does not open Share when file writing fails", async () => {
    mocks.write.mockRejectedValueOnce(new Error("Disk full"));
    await expect(shareOrDownload(new Blob(["image"]), "file.png", "image/png"))
      .rejects.toThrow("Disk full");
    expect(mocks.share).not.toHaveBeenCalled();
  });
});
