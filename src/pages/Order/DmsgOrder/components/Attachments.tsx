import { useEffect, useMemo, useState } from "react";
import { IonIcon } from "@ionic/react";
import { imageOutline } from "ionicons/icons";
import { AppCard } from "@/components/UI";
import { ImagePreview } from "@/components/ImagePreview/ImagePreview";
import useDmsgOrder from "@/hooks/apis/useDmsgOrder";
import type { DmsgAttachment } from "@/types/dmsg.type";

export default function Attachments({ value, savedValue, onChange, orderId, orderCode, disabled, onBusy }: {
  value: DmsgAttachment[]; savedValue: DmsgAttachment[]; onChange: (value: DmsgAttachment[]) => void;
  orderId?: string; orderCode?: string; disabled: boolean; onBusy: (busy: boolean) => void;
}) {
  const { upload, download } = useDmsgOrder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const costImages = useMemo(() => value.filter((f) => f.kind === "cost_image"), [value]);
  const previewImages = useMemo(() => {
    return costImages.map((f) => previews[f.fileId] || "").filter(Boolean);
  }, [costImages, previews]);

  const fileKey = value.map((file) => file.fileId).join(",");
  const savedFileKey = savedValue.map((file) => file.fileId).join(",");
  useEffect(() => { setError(""); }, [orderId, savedFileKey]);
  useEffect(() => {
    let active = true;
    setDownloadError("");
    const savedIds = new Set(savedValue.map((file) => file.fileId));
    if (orderId) void Promise.all(value.filter((item) => savedIds.has(item.fileId)).map(async (item) => {
      try {
        const file = await download(orderId, item.fileId);
        if (active) {
          setNames((old) => ({ ...old, [item.fileId]: file.name }));
          if (item.kind === "cost_image") setPreviews((old) => ({ ...old, [item.fileId]: file.url }));
        }
      } catch (cause) { if (active) setDownloadError((cause as Error).message); }
    }));
    return () => { active = false; };
  }, [orderId, fileKey, savedFileKey]);
  async function add(files: FileList | null, kind: DmsgAttachment["kind"]) {
    if (!files?.length) return;
    setError("");
    if (value.filter((f) => f.kind === kind).length + files.length > 10) { setError("Tối đa 10 tệp mỗi nhóm"); return; }
    setBusy(true); onBusy(true);
    const added: DmsgAttachment[] = [];
    try {
      for (const file of Array.from(files)) {
        const allowed = kind === "invoice_pdf" ? ["application/pdf"] : ["image/jpeg", "image/png", "image/webp"];
        if (!allowed.includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error("Sai định dạng hoặc tệp vượt 10 MB");
        const fileId = await upload(file);
        setNames((old) => ({ ...old, [fileId]: file.name }));
        if (kind === "cost_image") {
          const reader = new FileReader();
          reader.onload = () => setPreviews((old) => ({ ...old, [fileId]: String(reader.result) }));
          reader.readAsDataURL(file);
        }
        added.push({ fileId, kind });
      }
    } catch (cause) { setError((cause as Error).message); }
    finally { onChange([...value, ...added]); setBusy(false); onBusy(false); }
  }
  async function handleViewImage(file: DmsgAttachment) {
    let url = previews[file.fileId];
    if (!url && orderId && savedValue.some((item) => item.fileId === file.fileId)) {
      try {
        const downloaded = await download(orderId, file.fileId);
        url = downloaded.url;
        setPreviews((old) => ({ ...old, [file.fileId]: downloaded.url }));
        setNames((old) => ({ ...old, [file.fileId]: downloaded.name }));
      } catch (cause) {
        setError((cause as Error).message);
        return;
      }
    }
    if (!url) {
      setError("Chưa tải được ảnh, vui lòng thử lại sau.");
      return;
    }
    const validImages = costImages.filter((f) => Boolean(previews[f.fileId] || f.fileId === file.fileId));
    const targetIdx = validImages.findIndex((f) => f.fileId === file.fileId);
    setPreviewIndex(targetIdx >= 0 ? targetIdx : 0);
    setPreviewOpen(true);
  }
  async function open(fileId: string) {
    if (!orderId || !savedValue.some((file) => file.fileId === fileId)) { setError("Lưu đơn để xem/tải chứng từ vừa thêm"); return; }
    const tab = window.open("about:blank", "_blank");
    try {
      const file = await download(orderId, fileId);
      if (tab) { tab.opener = null; tab.location.href = file.url; }
      else window.location.assign(file.url);
    } catch (cause) { tab?.close(); setError((cause as Error).message); }
  }
  return <AppCard><h2 className="font-bold mb-2">Chứng từ đính kèm</h2>
    <p className="text-xs text-gray-500 mb-3">Tối đa 10 tệp mỗi nhóm · 10 MB/tệp · Lưu đơn để xác nhận thay đổi</p>
    {(["cost_image", "invoice_pdf"] as const).map((kind) => <section key={kind} className="mb-4">
      <label className="block font-medium mb-2">{kind === "cost_image" ? "Ảnh giá vốn" : "PDF hóa đơn đã xuất"}
        {!disabled && <input className="block w-full mt-2 min-h-11 text-sm" type="file" multiple accept={kind === "cost_image" ? "image/jpeg,image/png,image/webp" : "application/pdf"} disabled={busy} onChange={(event) => { void add(event.target.files, kind); event.target.value = ""; }} />}
      </label>
      {!value.some((f) => f.kind === kind) && <p className="text-sm text-gray-500">Chưa có tệp đính kèm</p>}
      {value.filter((f) => f.kind === kind).map((file, index) => <div key={file.fileId} className="flex gap-2 items-center border-b py-2">
        {kind === "cost_image" && (
          previews[file.fileId] ? (
            <img
              src={previews[file.fileId]}
              alt={names[file.fileId] || "Ảnh giá vốn"}
              className="w-12 h-12 object-cover rounded cursor-pointer active:opacity-80 shrink-0"
              onClick={() => void handleViewImage(file)}
            />
          ) : (
            <div
              className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center cursor-pointer text-gray-400 shrink-0"
              onClick={() => void handleViewImage(file)}
            >
              <IonIcon icon={imageOutline} className="text-xl" />
            </div>
          )
        )}
        <button
          type="button"
          className="min-h-11 text-blue-600 text-left break-all flex-1"
          onClick={() => {
            if (kind === "cost_image") void handleViewImage(file);
            else void open(file.fileId);
          }}
        >
          {names[file.fileId] || `${kind === "cost_image" ? "Ảnh" : "Hóa đơn"} ${index + 1}`}
        </button>
        {!savedValue.some((saved) => saved.fileId === file.fileId) && <span className="text-xs text-gray-500">Chưa lưu</span>}
        {!disabled && <button type="button" disabled={busy} className="min-h-11 px-3 text-red-600" onClick={() => { if (window.confirm("Gỡ tệp khỏi đơn?")) onChange(value.filter((f) => f.fileId !== file.fileId)); }}>Gỡ</button>}
      </div>)}
    </section>)}
    {busy && <p role="status">Đang tải tệp…</p>}
    {(error || downloadError) && <p role="alert" className="text-red-600">{error || downloadError}</p>}
    <ImagePreview
      images={previewImages}
      initialIndex={previewIndex}
      isOpen={previewOpen}
      onClose={() => setPreviewOpen(false)}
      fileNamePrefix={orderCode || "dmsg_chung_tu"}
    />
  </AppCard>;
}
