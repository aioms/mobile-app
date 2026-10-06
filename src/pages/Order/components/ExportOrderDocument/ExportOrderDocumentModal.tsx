import { useEffect, useRef, useState } from "react";
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from "@ionic/react";
import { AppButton, AppCard, AppRadioGroup } from "@/components/UI";
import { useAuth, useLoading } from "@/hooks";
import useOrder from "@/hooks/apis/useOrder";
import { useExportOrderDocument } from "@/hooks/useExportOrderDocument";
import {
  DocumentKind,
  LegalEntity,
  ORDER_ENTITIES,
  OrderExportFormat,
} from "@/common/constants/order-document";
import { OrderStatus } from "@/common/enums/order";
import { IOrder } from "@/types/order.type";
import OrderDocument, { DocumentProps } from "./OrderDocument";
import DocumentPreview from "./DocumentPreview";

interface Props {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
}
export default function ExportOrderDocumentModal(
  { isOpen, orderId, onClose }: Props,
) {
  const [order, setOrder] = useState<IOrder | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [kind, setKind] = useState<DocumentKind>("quotation");
  const [entity, setEntity] = useState<LegalEntity>("kim-sang");
  const [format, setFormat] = useState<OrderExportFormat>("pdf");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString());
  const { user } = useAuth();
  const { getDetail } = useOrder();
  const { isLoading, withLoading } = useLoading();
  const { exportDocument, isExporting } = useExportOrderDocument();
  const documentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let current = true;
    setOrder(null);
    setError("");
    setIssuedAt(new Date().toISOString());
    void withLoading(async () => {
      try {
        const result: IOrder = await getDetail(orderId);
        if (result?.status === OrderStatus.CANCELLED) {
          throw new Error("Đơn hàng đã hủy không thể in.");
        }
        if (
          !result?.document
        ) {
          throw new Error(
            "Đơn hàng chưa hỗ trợ xuất tài liệu. Vui lòng tải lại.",
          );
        }
        if (current) setOrder(result);
      } catch (failure) {
        if (current) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Không thể tải đơn hàng",
          );
        }
        throw failure;
      }
    });
    return () => {
      current = false;
    };
  }, [isOpen, orderId, retry]);

  const props: DocumentProps | null = order
    ? {
      order,
      kind,
      entity: ORDER_ENTITIES[entity],
      issuedAt,
      authorName: user?.fullname || user?.username || "",
    }
    : null;
  const empty = !!order && !order.document?.items.length;
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} canDismiss={!isExporting}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>In đơn</IonTitle>
          <IonButtons slot="end">
            <IonButton disabled={isExporting} onClick={onClose}>Đóng</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="bg-gray-50">
        <div className="p-4 space-y-4">
          <AppCard className="p-4">
            <Choice
              label="Mẫu tài liệu"
              value={kind}
              disabled={isExporting}
              onChange={setKind}
              options={[["quotation", "Báo giá"], [
                "invoice",
                "Hóa đơn tính tiền",
              ]]}
            />
            <Choice
              label="Pháp nhân"
              value={entity}
              disabled={isExporting}
              onChange={setEntity}
              options={[["kim-sang", "CH Kim Sang"], [
                "ngan-kim",
                "Cty Ngân Kim",
              ]]}
            />
            <Choice
              label="Định dạng"
              value={format}
              disabled={isExporting}
              onChange={setFormat}
              options={[["pdf", "PDF"], ["excel", "Excel"], [
                "image",
                "Ảnh PNG",
              ]]}
            />
          </AppCard>
          {isLoading && (
            <div role="status" className="text-center p-4">
              <IonSpinner />
              <p>Đang tải đơn hàng...</p>
            </div>
          )}
          {error && (
            <AppCard className="p-4">
              <p role="alert" className="text-red-600 mb-3">{error}</p>
              <AppButton
                onClick={() =>
                  setRetry((value) => value + 1)}
              >
                Thử lại
              </AppButton>
            </AppCard>
          )}
          {empty && (
            <AppCard className="p-4">
              <p>Đơn hàng không còn sản phẩm để xuất.</p>
              <AppButton className="mt-3" onClick={onClose}>
                Trở lại đơn hàng
              </AppButton>
            </AppCard>
          )}
          {props && !empty && (
            <AppCard className="p-3">
              <p className="text-xs text-gray-500 mb-2">Bản in dùng dữ liệu đơn đã lưu.</p>
              <h2 className="text-sm font-semibold mb-3">
                Xem trước · {kind === "quotation" ? "A4" : "80mm"}
              </h2>
              <DocumentPreview {...props} />
            </AppCard>
          )}
          <AppButton
            data-cy="order-export-submit"
            variant="primary"
            fullWidth
            loading={isExporting}
            loadingText="Đang tạo file..."
            disabled={isLoading || !props || empty}
            onClick={() => {
              if (!props) return;
              const now = new Date().toISOString();
              setIssuedAt(now);
              void exportDocument({ ...props, issuedAt: now }, format, documentRef);
            }}
          >
            Xuất và lưu / chia sẻ
          </AppButton>
        </div>
        {props && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed",
              left: -10000,
              top: 0,
              pointerEvents: "none",
            }}
          >
            <OrderDocument ref={documentRef} {...props} />
          </div>
        )}
      </IonContent>
    </IonModal>
  );
}

function Choice<T extends string>(
  { label, options, value, onChange, disabled }: {
    label: string;
    options: [T, string][];
    value: T;
    onChange: (value: T) => void;
    disabled: boolean;
  },
) {
  return (
    <fieldset disabled={disabled} className="mb-3">
      <legend className="text-sm font-semibold text-gray-800 mb-2">
        {label}
      </legend>
      <AppRadioGroup
        name={label}
        disabled={disabled}
        value={value}
        onChange={onChange}
        options={options.map(([option, text]) => ({
          value: option,
          label: text,
          dataCy: `order-export-${option}`,
        }))}
      />
    </fieldset>
  );
}
