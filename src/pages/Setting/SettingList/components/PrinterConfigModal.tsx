import React, { useEffect, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import AppCard from "@/components/UI/AppCard";
import AppRadioGroup, {
  AppRadioOption,
} from "@/components/UI/AppRadioGroup";
import { BarcodeLayoutOption, PrinterSettings } from "../types";

interface PrinterConfigDraft {
  ipAddress: string;
  port: string;
  timeout: string;
  barcodeLayout: BarcodeLayoutOption;
}

type FieldErrors = Partial<Record<keyof PrinterConfigDraft, string>>;

const LAYOUT_OPTIONS: AppRadioOption<BarcodeLayoutOption>[] = [
  {
    value: "auto-pair",
    label: "Tự động ghép đôi",
    description:
      "In 2 tem trên mỗi khổ 76 mm; số lượng lẻ sẽ để 1 tem ở khổ cuối.",
  },
  {
    value: "single",
    label: "Một tem mỗi khổ",
    description: "Mỗi khổ chỉ in 1 tem, tốn giấy nhưng dễ kiểm tra.",
  },
];

const toDraft = (settings: PrinterSettings): PrinterConfigDraft => ({
  ipAddress: settings.ipAddress,
  port: String(settings.port),
  timeout: String(settings.timeout),
  barcodeLayout: settings.barcodeLayout,
});

const isValidIpv4 = (value: string): boolean => {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255;
  });
};

const validateDraft = (draft: PrinterConfigDraft): FieldErrors => {
  const errors: FieldErrors = {};
  const ipAddress = draft.ipAddress.trim();
  const port = Number(draft.port);
  const timeout = Number(draft.timeout);

  if (!isValidIpv4(ipAddress)) {
    errors.ipAddress = "Địa chỉ IP không hợp lệ (ví dụ: 192.168.1.220)";
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.port = "Cổng phải là số nguyên từ 1 đến 65535";
  }
  if (!Number.isInteger(timeout) || timeout < 500 || timeout > 60000) {
    errors.timeout = "Thời gian chờ từ 500 đến 60000 ms";
  }

  return errors;
};

interface PrinterConfigModalProps {
  isOpen: boolean;
  settings: PrinterSettings;
  onDismiss: () => void;
  onSave: (settings: PrinterSettings) => void | Promise<void>;
}

const PrinterConfigModal: React.FC<PrinterConfigModalProps> = ({
  isOpen,
  settings,
  onDismiss,
  onSave,
}) => {
  const [draft, setDraft] = useState<PrinterConfigDraft>(() =>
    toDraft(settings)
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    setDraft(toDraft(settings));
    setErrors({});
  }, [isOpen, settings]);

  const updateDraft = <K extends keyof PrinterConfigDraft>(
    field: K,
    value: PrinterConfigDraft[K]
  ) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const handleSave = async () => {
    const nextErrors = validateDraft(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      ...settings,
      ipAddress: draft.ipAddress.trim(),
      port: Number(draft.port),
      timeout: Number(draft.timeout),
      barcodeLayout: draft.barcodeLayout,
    });
    onDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="medium" onClick={onDismiss}>
              Hủy
            </IonButton>
          </IonButtons>
          <IonTitle>Cấu hình máy in</IonTitle>
          <IonButtons slot="end">
            <IonButton strong onClick={() => void handleSave()}>
              Lưu
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <div className="px-4 pt-4 pb-20">
          <AppCard>
            <IonInput
              label="Địa chỉ IP"
              labelPlacement="stacked"
              fill="outline"
              inputmode="decimal"
              placeholder="192.168.1.220"
              value={draft.ipAddress}
              onIonInput={(event) =>
                updateDraft("ipAddress", event.detail.value ?? "")
              }
            />
            {errors.ipAddress && (
              <p className="text-xs text-red-500 mt-1">{errors.ipAddress}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <IonInput
                  label="Cổng (Port)"
                  labelPlacement="stacked"
                  fill="outline"
                  type="number"
                  inputmode="numeric"
                  placeholder="9100"
                  value={draft.port}
                  onIonInput={(event) =>
                    updateDraft("port", event.detail.value ?? "")
                  }
                />
                {errors.port && (
                  <p className="text-xs text-red-500 mt-1">{errors.port}</p>
                )}
              </div>
              <div>
                <IonInput
                  label="Timeout (ms)"
                  labelPlacement="stacked"
                  fill="outline"
                  type="number"
                  inputmode="numeric"
                  placeholder="5000"
                  value={draft.timeout}
                  onIonInput={(event) =>
                    updateDraft("timeout", event.detail.value ?? "")
                  }
                />
                {errors.timeout && (
                  <p className="text-xs text-red-500 mt-1">{errors.timeout}</p>
                )}
              </div>
            </div>
          </AppCard>

          <AppCard>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Bố cục tem mã vạch
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Áp dụng cho khổ giấy {settings.paperWidth} ×{" "}
              {settings.paperHeight} mm.
            </p>
            <AppRadioGroup<BarcodeLayoutOption>
              name="barcode-layout"
              options={LAYOUT_OPTIONS}
              value={draft.barcodeLayout}
              onChange={(value) => updateDraft("barcodeLayout", value)}
            />
          </AppCard>

          <p className="text-xs text-gray-500 px-1">
            Cấu hình chỉ lưu trên thiết bị này. Máy in cần kết nối cùng mạng LAN
            với proxy server AIOM.
          </p>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PrinterConfigModal;
