import React, { useState, useEffect } from "react";
import {
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
} from "@ionic/react";
import { chevronBack, copy, checkmark, download } from "ionicons/icons";
import { formatCurrency } from "@/helpers/formatters";
import { VietQR } from "vietqr";

interface QRCodeDisplayProps {
  amount: number;
  orderCode: string;
  onBack: () => void;
  onContinue: () => void;
}

// Bank account configuration - replace with actual values
const BANK_CONFIG = {
  accountNumber: "1234567890",
  accountName: "CONG TY AIOM SYSTEM",
  bankCode: "970415", // VCB - Vietcombank
};

// VietQR API configuration - replace with your actual credentials
const VIETQR_CONFIG = {
  clientID: import.meta.env.VITE_VIETQR_CLIENT_ID,
  apiKey: import.meta.env.VITE_VIETQR_API_KEY,
};

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  amount,
  orderCode,
  onBack,
  onContinue,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [amount, orderCode]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setError("");

      // Initialize VietQR with credentials
      const vietQR = new VietQR({
        clientID: VIETQR_CONFIG.clientID,
        apiKey: VIETQR_CONFIG.apiKey,
      });

      const transferContent = `Thanh toan ${orderCode}`;

      // Generate QR code using the correct API
      const { data: result } = await vietQR.genQRCodeBase64({
        bank: BANK_CONFIG.bankCode,
        accountNumber: BANK_CONFIG.accountNumber,
        accountName: BANK_CONFIG.accountName,
        amount: amount.toString(),
        memo: transferContent,
        template: "compact2", // Options: 'qr_only', 'compact', 'compact2'
      });

      if (!result || result.code !== "00") {
        throw new Error(result?.desc || "Failed to generate QR code");
      }

      setQrCodeUrl(result.data.qrDataURL);
    } catch (err) {
      console.error("Error generating QR code:", err);
      setError("Không thể tạo mã QR. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAccountInfo = async () => {
    const accountInfo = `Số tài khoản: ${
      BANK_CONFIG.accountNumber
    }\nTên tài khoản: ${BANK_CONFIG.accountName}\nSố tiền: ${formatCurrency(
      amount
    )}\nNội dung: Thanh toan don hang`;

    try {
      await navigator.clipboard.writeText(accountInfo);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `QR-${orderCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download QR code:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 mb-6">
        <IonButton fill="clear" onClick={onBack} className="p-0">
          <IonIcon icon={chevronBack} className="text-xl" />
        </IonButton>
        <span className="text-lg font-semibold text-gray-800">
          Quét mã QR để thanh toán
        </span>
      </div>

      <IonCard>
        <IonCardContent className="p-6 text-center">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Chuyển khoản ngân hàng
            </h2>
            <p className="text-gray-600">
              Quét mã QR hoặc chuyển khoản theo thông tin bên dưới
            </p>
          </div>

          {/* QR Code Display */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <IonSpinner name="crescent" />
                <span className="ml-2">Đang tạo mã QR...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-64 text-red-500">
                <p className="mb-4">{error}</p>
                <IonButton fill="outline" onClick={generateQRCode}>
                  Thử lại
                </IonButton>
              </div>
            ) : qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="mx-auto max-w-full h-auto"
                style={{ maxHeight: "300px" }}
              />
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                Đang tải mã QR...
              </div>
            )}
          </div>

          {/* Bank Information */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">
              Thông tin chuyển khoản
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ngân hàng:</span>
                <span className="font-medium">Vietcombank</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tài khoản:</span>
                <span className="font-medium">{BANK_CONFIG.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tên tài khoản:</span>
                <span className="font-medium">{BANK_CONFIG.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Số tiền:</span>
                <span className="font-bold text-green-600">
                  {formatCurrency(amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nội dung:</span>
                <span className="font-medium">Thanh toan {orderCode}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex space-x-3">
              <IonButton
                fill="outline"
                expand="block"
                onClick={copyAccountInfo}
                className="flex-1"
              >
                <IonIcon
                  icon={isCopied ? checkmark : copy}
                  slot="start"
                  className={isCopied ? "text-green-500" : ""}
                />
                {isCopied ? "Đã sao chép" : "Sao chép"}
              </IonButton>

              {qrCodeUrl && (
                <IonButton
                  fill="outline"
                  expand="block"
                  onClick={downloadQRCode}
                  className="flex-1"
                >
                  <IonIcon icon={download} slot="start" />
                  Tải xuống
                </IonButton>
              )}
            </div>

            <IonButton expand="block" onClick={onContinue}>
              Đã chuyển khoản
            </IonButton>

            <p className="text-xs text-gray-500">
              Sau khi chuyển khoản thành công, vui lòng nhấn "Đã chuyển khoản"
            </p>
          </div>
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default QRCodeDisplay;