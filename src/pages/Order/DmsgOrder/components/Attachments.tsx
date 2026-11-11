import { useEffect, useState } from "react";
import { AppCard } from "@/components/UI";
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
  return <AppCard><h2 className="font-bold mb-2">Chứng từ đính kèm</h2>
    <p className="text-xs text-gray-500 mb-3">Tối đa 10 tệp mỗi nhóm · 10 MB/tệp · Lưu đơn để xác nhận thay đổi</p>
    {(["cost_image", "invoice_pdf"] as const).map((kind) => <section key={kind} className="mb-4">
      <label className="block font-medium mb-2">{kind === "cost_image" ? "Ảnh giá vốn" : "PDF hóa đơn đã xuất"}
        {!disabled && <input className="block w-full mt-2 min-h-11 text-sm" type="file" multiple accept={kind === "cost_image" ? "image/jpeg,image/png,image/webp" : "application/pdf"} disabled={busy} onChange={(event) => { void add(event.target.files, kind); event.target.value = ""; }} />}
      </label>
      {!value.some((f) => f.kind === kind) && <p className="text-sm text-gray-500">Chưa có tệp đính kèm</p>}
      {value.filter((f) => f.kind === kind).map((file, index) => <div key={file.fileId} className="flex gap-2 items-center border-b py-2">
        {previews[file.fileId] && <img src={previews[file.fileId]} alt="Ảnh giá vốn" className="w-12 h-12 object-cover rounded" />}
        <button type="button" className="min-h-11 text-blue-600 text-left break-all flex-1" onClick={() => void open(file.fileId)}>{names[file.fileId] || `${kind === "cost_image" ? "Ảnh" : "Hóa đơn"} ${index + 1}`}</button>
        {!disabled && <button type="button" disabled={busy} className="min-h-11 px-3 text-red-600" onClick={() => { if (window.confirm("Gỡ tệp khỏi đơn?")) onChange(value.filter((f) => f.fileId !== file.fileId)); }}>Gỡ</button>}
      </div>)}
    </section>)}
    {busy && <p role="status">Đang tải tệp…</p>}
    {error && <p role="alert" className="text-red-600">{error}</p>}
  </AppCard>;
}
