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
import { useAuth } from "@/hooks/useAuth";
import useUser from "@/hooks/apis/useUser";
import { useLoading } from "@/hooks/useLoading";
import { useIonToast } from "@ionic/react";

interface QRCodeDisplayProps {
  amount: number;
  receiptCode: string;
  onBack: () => void;
  onContinue: () => void;
}

// VietQR API configuration
const VIETQR_CONFIG = {
  clientID: import.meta.env.VITE_VIETQR_CLIENT_ID,
  apiKey: import.meta.env.VITE_VIETQR_API_KEY,
};

interface BankConfig {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  amount,
  receiptCode,
  onBack,
  onContinue,
}) => {
  const { user } = useAuth();
  const { getDetail } = useUser();
  const { withLoading } = useLoading();
  const [presentToast] = useIonToast();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserBankInfo();
    }
  }, [user?.id]);

  useEffect(() => {
    if (bankConfig) {
      generateQRCode();
    }
  }, [amount, receiptCode, bankConfig]);

  const fetchUserBankInfo = async () => {
    if (!user?.id) return;

    await withLoading(async () => {
      try {
        const userData = await getDetail(user.id);

        if (userData) {
          setBankConfig({
            accountNumber: userData.bankAccountNumber || "",
            accountName: userData.bankAccountName || "",
            bankCode: userData.bankCode || "",
          });
        } else {
          throw new Error("Không tìm thấy thông tin tài khoản ngân hàng");
        }
      } catch (error) {
        await presentToast({
          message:
            (error as Error).message || "Không thể tải thông tin ngân hàng",
          duration: 3000,
          position: "top",
          color: "danger",
        });
        setError("Không thể tải thông tin ngân hàng");
      }
    });
  };

  const handleRetry = async () => {
    setError("");
    setQrCodeUrl("");

    // Re-fetch bank info if it's missing
    if (!bankConfig && user?.id) {
      await fetchUserBankInfo();
    } else if (bankConfig) {
      // If bank config exists, just regenerate QR
      await generateQRCode();
    }
  };

  const generateQRCode = async () => {
    if (!bankConfig) {
      setError("Thông tin ngân hàng chưa được tải");
      return;
    }

    if (
      !bankConfig.accountNumber ||
      !bankConfig.accountName ||
      !bankConfig.bankCode
    ) {
      setError("Thông tin ngân hàng không đầy đủ");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // Initialize VietQR with credentials
      const vietQR = new VietQR({
        clientID: VIETQR_CONFIG.clientID,
        apiKey: VIETQR_CONFIG.apiKey,
      });

      const transferContent = `Thanh toan ${receiptCode}`;

      // Generate QR code using the correct API
      const { data: result } = await vietQR.genQRCodeBase64({
        bank: bankConfig.bankCode,
        accountNumber: bankConfig.accountNumber,
        accountName: bankConfig.accountName,
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
    if (!bankConfig) return;

    const accountInfo = `Số tài khoản: ${
      bankConfig.accountNumber
    }\nTên tài khoản: ${bankConfig.accountName}\nSố tiền: ${formatCurrency(
      amount
    )}\nNội dung: Thanh toan ${receiptCode}`;

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
      // Create a temporary link element
      const link = document.createElement("a");
      link.href = qrCodeUrl;
      link.download = `QR_Payment_${receiptCode}_${new Date().getTime()}.png`;

      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading QR code:", error);
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
          {isLoading ? (
            <div className="py-8">
              <IonSpinner name="crescent" className="mb-4" />
              <p className="text-gray-600">Đang tạo mã QR...</p>
            </div>
          ) : error ? (
            <div className="py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <IonButton fill="outline" onClick={handleRetry}>
                Thử lại
              </IonButton>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto w-64 h-64 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-semibold">Vietcombank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tài khoản:</span>
                  <span className="font-semibold">
                    {bankConfig?.accountNumber || "--"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tên tài khoản:</span>
                  <span className="font-semibold">
                    {bankConfig?.accountName || "--"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-semibold text-red-500">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nội dung:</span>
                  <span className="font-semibold">
                    Thanh toan {receiptCode}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-3">
                  <IonButton
                    fill="outline"
                    expand="block"
                    onClick={copyAccountInfo}
                    className="flex-1"
                  >
                    <IonIcon icon={isCopied ? checkmark : copy} slot="start" />
                    {isCopied ? "Đã sao chép" : "Sao chép"}
                  </IonButton>

                  <IonButton
                    fill="outline"
                    expand="block"
                    onClick={downloadQRCode}
                    className="flex-1"
                  >
                    <IonIcon icon={download} slot="start" />
                    Tải xuống
                  </IonButton>
                </div>

                <IonButton expand="block" onClick={onContinue}>
                  Đã chuyển khoản
                </IonButton>
              </div>
            </div>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
};

export default QRCodeDisplay;
