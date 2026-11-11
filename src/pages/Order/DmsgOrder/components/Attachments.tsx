import { useEffect, useState } from "react";
import { IonIcon } from "@ionic/react";
import { cloudUploadOutline, documentTextOutline, imageOutline, trashOutline } from "ionicons/icons";
import { AppBadge, AppCard } from "@/components/UI";
import useDmsgOrder from "@/hooks/apis/useDmsgOrder";
import type { DmsgAttachment } from "@/types/dmsg.type";

export default function Attachments({ value, onChange, orderId, disabled, onBusy }: {
  value: DmsgAttachment[]; onChange: (value: DmsgAttachment[]) => void;
  orderId?: string; disabled: boolean; onBusy: (busy: boolean) => void;
}) {
  const { upload, download } = useDmsgOrder();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const fileKey = value.map((file) => file.fileId).join(",");
  useEffect(() => {
    let active = true;
    if (orderId) void Promise.all(value.map(async (item) => {
      try {
        const file = await download(orderId, item.fileId);
        if (active) {
          setNames((old) => ({ ...old, [item.fileId]: file.name }));
          if (item.kind === "cost_image") setPreviews((old) => ({ ...old, [item.fileId]: file.url }));
        }
      } catch (cause) { if (active) setError((cause as Error).message); }
    }));
    return () => { active = false; };
  }, [orderId, fileKey]);
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
  async function open(fileId: string) {
    if (!orderId) { setError("Lưu đơn để xem/tải chứng từ"); return; }
    const tab = window.open("about:blank", "_blank");
    try {
      const file = await download(orderId, fileId);
      if (tab) { tab.opener = null; tab.location.href = file.url; }
      else window.location.assign(file.url);
    } catch (cause) { tab?.close(); setError((cause as Error).message); }
  }
  return <AppCard>
    <h2 className="text-base font-bold text-gray-900 mb-1">Chứng từ đính kèm</h2>
    <p className="text-xs text-gray-500 mb-3">Tối đa 10 tệp mỗi nhóm · 10 MB/tệp · Lưu đơn để xác nhận thay đổi</p>
    {(["cost_image", "invoice_pdf"] as const).map((kind) => {
      const kindFiles = value.filter((f) => f.kind === kind);
      const isImage = kind === "cost_image";
      return <section key={kind} className="mb-4 last:mb-0 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IonIcon icon={isImage ? imageOutline : documentTextOutline} className="text-base text-gray-600" />
            <span className="text-xs font-semibold text-gray-800">{isImage ? "Ảnh giá vốn" : "PDF hóa đơn đã xuất"}</span>
          </div>
          <AppBadge color="light" variant="soft" className="text-[10px] px-2 py-0.5">
            {kindFiles.length}/10
          </AppBadge>
        </div>
        {!disabled && (
          <label className="flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-blue-500 bg-gray-50 rounded-xl py-2.5 px-3 mb-2 cursor-pointer transition-colors text-xs text-gray-600 font-medium">
            <IonIcon icon={cloudUploadOutline} className="text-base text-blue-600" />
            <span>Chọn {isImage ? "ảnh giá vốn" : "file PDF hóa đơn"}</span>
            <input className="hidden" type="file" multiple accept={isImage ? "image/jpeg,image/png,image/webp" : "application/pdf"} disabled={busy} onChange={(event) => { void add(event.target.files, kind); event.target.value = ""; }} />
          </label>
        )}
        {!kindFiles.length && <p className="text-xs text-gray-400 py-1">Chưa có tệp đính kèm</p>}
        {kindFiles.map((file, index) => <div key={file.fileId} className="flex gap-2.5 items-center border border-gray-100 rounded-xl p-2 mb-1.5 bg-gray-50">
          {previews[file.fileId] ? (
            <img src={previews[file.fileId]} alt="Ảnh giá vốn" className="w-10 h-10 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <IonIcon icon={isImage ? imageOutline : documentTextOutline} className="text-lg" />
            </div>
          )}
          <button type="button" className="text-xs text-blue-600 font-medium text-left break-all flex-1 hover:underline leading-snug" onClick={() => void open(file.fileId)}>{names[file.fileId] || `${isImage ? "Ảnh" : "Hóa đơn"} ${index + 1}`}</button>
          {!disabled && <button type="button" disabled={busy} aria-label="Gỡ tệp" className="p-2 text-gray-400 hover:text-red-600 transition-colors" onClick={() => { if (window.confirm("Gỡ tệp khỏi đơn?")) onChange(value.filter((f) => f.fileId !== file.fileId)); }}><IonIcon icon={trashOutline} className="text-base" /></button>}
        </div>)}
      </section>;
    })}
    {busy && <p role="status" className="text-xs text-blue-600 mt-2 font-medium">Đang tải tệp…</p>}
    {error && <p role="alert" className="text-xs text-red-600 mt-2">{error}</p>}
  </AppCard>;
}
