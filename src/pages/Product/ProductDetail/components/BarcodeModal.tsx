import React, { useRef, useState } from "react";
import Barcode from "react-barcode";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
} from "@ionic/react";
import { close, printOutline, barcode } from "ionicons/icons";

interface Props {
  isOpen: boolean;
  onDidDismiss: () => void;
  productName?: string;
  productCode?: string;
}

const BarcodeModal: React.FC<Props> = ({
  isOpen,
  onDidDismiss,
  productName,
  productCode,
}) => {
  const barcodeRef = useRef<HTMLDivElement>(null);
  const [printQuantity, setPrintQuantity] = useState<number>(1);

  const handlePrint = () => {
    if (barcodeRef.current && printQuantity > 0) {
      const win = window.open("");

      // Generate thermal label content for 35x22mm labels
      let labelsHTML = '';
      for (let i = 0; i < printQuantity; i++) {
        labelsHTML += `
          <div class="thermal-label">
            <div class="product-name">${productName || ""}</div>
            <div class="barcode-container">
              ${barcodeRef.current.innerHTML}
            </div>
          </div>
        `;
      }

      win?.document.write(`
        <html>
          <head>
            <style>
              @page {
                size: 35mm 22mm;
                margin: 0;
                padding: 0;
              }

              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }

              body {
                width: 35mm;
                height: 22mm;
                overflow: hidden;
                background: white;
                font-family: Arial, sans-serif;
                font-size: 8px;
              }

              .thermal-label {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 1mm;
                background: white;
              }

              .product-name {
                width: 100%;
                text-align: center;
                font-size: 6px;
                font-weight: bold;
                color: black;
                line-height: 1.1;
                margin-bottom: 0.5mm;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }

              .barcode-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
              }

              .barcode-container svg {
                width: 100% !important;
                height: auto !important;
                max-height: 12mm !important;
              }

              .barcode-container text {
                font-size: 6px !important;
                fill: black !important;
              }

              @media print {
                body {
                  width: 35mm;
                  height: 22mm;
                }

                .thermal-label {
                  page-break-after: always;
                  page-break-inside: avoid;
                }

                .thermal-label:last-child {
                  page-break-after: auto;
                }
              }

              /* Hide browser print headers/footers */
              @print {
                @page {
                  margin: 0;
                  size: 35mm 22mm;
                }
              }
            </style>
          </head>
          <body>
            ${labelsHTML}
          </body>
        </html>
      `);

      win?.document.close();

      // Set print options for thermal printer
      setTimeout(() => {
        if (win) {
          win.print();
          setTimeout(() => {
            win.close();
          }, 1000);
        }
      }, 500);
    }
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setPrintQuantity(numValue);
    } else if (value === '') {
      setPrintQuantity(1);
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      breakpoints={[0, 0.5, 0.75]}
      initialBreakpoint={0.75}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-medium">Mã vạch sản phẩm</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="flex flex-col items-center">
          <div className="w-full bg-white rounded-xl p-4 mb-6 flex flex-col items-center">
            {productCode ? (
              <>
                <div className="text-sm text-gray-500 mb-4">{productName}</div>
                <div ref={barcodeRef}>
                  <Barcode
                    value={productCode}
                    width={0.8}
                    height={40}
                    fontSize={8}
                    margin={2}
                    displayValue={true}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <IonIcon icon={barcode} className="text-4xl mb-2" />
                <p className="text-sm">Chưa có mã vạch</p>
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-3">
            <div className="bg-white rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số lượng in
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={printQuantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập số lượng"
                />
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  bản in
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Tối đa 100 bản in mỗi lần
              </p>
            </div>

            <IonButton
              expand="block"
              onClick={handlePrint}
              className="h-12"
              disabled={printQuantity <= 0 || printQuantity > 100}
            >
              <IonIcon icon={printOutline} slot="start" />
              In mã vạch
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BarcodeModal;
