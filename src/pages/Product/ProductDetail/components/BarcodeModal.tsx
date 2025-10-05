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
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  useIonToast,
  IonList,
  IonSpinner,
  IonBadge,
} from "@ionic/react";
import { close, printOutline, barcode, settings, wifi, search, checkmark } from "ionicons/icons";
import { useLoading } from "@/hooks";
import { createXprinterService, DEFAULT_XPRINTER_CONFIG } from "@/helpers/printerService";
import { PrinterConfig } from "@/types/printer";
import LocalNetworkService from "@/services/localNetworkService";
import { PrinterDevice } from "@/types/localNetwork";

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
  const [presentToast] = useIonToast();
  const { isLoading, withLoading } = useLoading();

  // Network printer settings
  const [useNetworkPrinter, setUseNetworkPrinter] = useState<boolean>(false);
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    ipAddress: "192.168.1.135",
    ...DEFAULT_XPRINTER_CONFIG
  });
  const [showPrinterSettings, setShowPrinterSettings] = useState<boolean>(false);

  // Local network discovery states
  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);
  const [showDiscovery, setShowDiscovery] = useState<boolean>(false);

  const handlePrint = () => {
    if (useNetworkPrinter) {
      handleNetworkPrint();
    } else {
      handleBrowserPrint();
    }
  };

  const handleNetworkPrint = async () => {
    if (!productCode) {
      await presentToast({
        message: "Không có mã vạch để in",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    await withLoading(async () => {
      try {
        const printerService = createXprinterService(printerConfig);

        const printJob = {
          productName: productName || "",
          productCode: productCode,
          quantity: printQuantity
        };

        // Use the new enhanced barcode printing method
        const result = await printerService.printBarcodeLabel(printJob, printQuantity);

        if (result.success) {
          await presentToast({
            message: result.message,
            duration: 3000,
            position: "top",
            color: "success",
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        await presentToast({
          message: (error as Error).message,
          duration: 3000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  const handleBrowserPrint = () => {
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

  const handleTestConnection = async () => {
    await withLoading(async () => {
      try {
        const printerService = createXprinterService(printerConfig);
        const status = await printerService.testConnection();

        if (status.isConnected) {
          await presentToast({
            message: "✅ Kết nối máy in Xprinter 365B thành công!",
            duration: 2000,
            position: "top",
            color: "success",
          });
        } else {
          throw new Error(status.errorMessage || "Không thể kết nối đến máy in");
        }
      } catch (error) {
        await presentToast({
          message: (error as Error).message,
          duration: 3000,
          position: "top",
          color: "danger",
        });
      }
    });
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      setPrintQuantity(numValue);
    } else if (value === '') {
      setPrintQuantity(1);
    }
  };

  const handlePrinterConfigChange = (field: keyof PrinterConfig, value: string | number) => {
    setPrinterConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Local Network Discovery Functions
  const handleDiscoverPrinters = async () => {
    setIsDiscovering(true);
    try {
      // Request permission first
      const hasPermission = await LocalNetworkService.requestLocalNetworkPermission();
      
      if (!hasPermission) {
        await presentToast({
          message: "Cần quyền truy cập mạng local để tìm kiếm máy in",
          duration: 3000,
          position: "top",
          color: "warning",
        });
        return;
      }

      await presentToast({
        message: "Đang tìm kiếm máy in trên mạng local...",
        duration: 2000,
        position: "top",
        color: "primary",
      });

      // Discover printers on common network ranges
      const networkRanges = ['192.168.0', '192.168.1', '10.0.0'];
      let allPrinters: PrinterDevice[] = [];

      for (const range of networkRanges) {
        const printers = await LocalNetworkService.discoverPrinters(range);
        allPrinters = [...allPrinters, ...printers];
      }

      // Remove duplicates based on IP
      const uniquePrinters = allPrinters.filter((printer, index, self) => 
        index === self.findIndex(p => p.ip === printer.ip)
      );

      setDiscoveredPrinters(uniquePrinters);

      if (uniquePrinters.length > 0) {
        await presentToast({
          message: `Tìm thấy ${uniquePrinters.length} máy in`,
          duration: 2000,
          position: "top",
          color: "success",
        });
        setShowDiscovery(true);
      } else {
        await presentToast({
          message: "Không tìm thấy máy in nào trên mạng local",
          duration: 3000,
          position: "top",
          color: "warning",
        });
      }
    } catch (error) {
      await presentToast({
        message: `Lỗi khi tìm kiếm máy in: ${(error as Error).message}`,
        duration: 3000,
        position: "top",
        color: "danger",
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleSelectPrinter = async (printer: PrinterDevice) => {
    try {
      const connected = await LocalNetworkService.connectToPrinter(printer);
      
      if (connected) {
        setSelectedPrinter(printer);
        setPrinterConfig(prev => ({
          ...prev,
          ipAddress: printer.ip,
          port: printer.port
        }));
        setUseNetworkPrinter(true);
        setShowDiscovery(false);
        
        await presentToast({
          message: `Đã chọn máy in ${printer.name || printer.ip}`,
          duration: 2000,
          position: "top",
          color: "success",
        });
      }
    } catch (error) {
      await presentToast({
        message: `Lỗi khi kết nối máy in: ${(error as Error).message}`,
        duration: 3000,
        position: "top",
        color: "danger",
      });
    }
  };

  const getPrinterStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'danger';
      default: return 'warning';
    }
  };

  const getBarcodeTypeIcon = () => {
    return barcode;
  };

  const getBarcodeTypeDescription = () => {
    return 'Mã vạch Code128 - Hỗ trợ chữ và số';
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDidDismiss}
      breakpoints={[0, 0.5, 0.75, 0.9]}
      initialBreakpoint={0.75}
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle className="font-medium">Mã vạch sản phẩm</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowPrinterSettings(!showPrinterSettings)}>
              <IonIcon icon={settings} />
            </IonButton>
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

          {/* Barcode Type Information */}
          <IonCard className="w-full mb-4">
            <IonCardHeader>
              <IonCardTitle className="text-base">
                <IonIcon icon={getBarcodeTypeIcon()} className="mr-2" />
                Loại mã vạch
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium" className="text-xs block">
                {getBarcodeTypeDescription()}
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Printer Settings */}
          {showPrinterSettings && (
            <IonCard className="w-full mb-4">
              <IonCardHeader>
                <IonCardTitle className="text-base">
                  <IonIcon icon={wifi} className="mr-2" />
                  Cài đặt máy in Xprinter 365B
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonItem>
                  <IonLabel>Sử dụng máy in mạng</IonLabel>
                  <IonToggle
                    checked={useNetworkPrinter}
                    onIonChange={(e) => setUseNetworkPrinter(e.detail.checked)}
                  />
                </IonItem>

                {useNetworkPrinter && (
                  <>
                    {/* Auto Discovery Section */}
                    <div className="mt-4">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={handleDiscoverPrinters}
                        disabled={isDiscovering}
                        color="primary"
                      >
                        {isDiscovering ? (
                          <>
                            <IonSpinner name="crescent" slot="start" />
                            Đang tìm kiếm...
                          </>
                        ) : (
                          <>
                            <IonIcon icon={search} slot="start" />
                            Tìm máy in tự động
                          </>
                        )}
                      </IonButton>
                      
                      <IonText color="primary" className="text-xs mt-2 block text-center">
                        🔍 Tự động tìm kiếm máy in trên mạng local (yêu cầu quyền truy cập)
                      </IonText>
                    </div>

                    {/* Discovered Printers List */}
                    {showDiscovery && discoveredPrinters.length > 0 && (
                      <div className="mt-4">
                        <IonText color="dark" className="text-sm font-medium block mb-2">
                          Máy in tìm thấy:
                        </IonText>
                        <IonList className="rounded-lg">
                          {discoveredPrinters.map((printer, index) => (
                            <IonItem 
                              key={`${printer.ip}-${printer.port}`}
                              button
                              onClick={() => handleSelectPrinter(printer)}
                              className={selectedPrinter?.ip === printer.ip ? 'selected-printer' : ''}
                            >
                              <div className="flex flex-col w-full">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <IonText color="dark" className="font-medium">
                                      {printer.name || `Printer ${index + 1}`}
                                    </IonText>
                                    <IonText color="medium" className="text-xs block">
                                      {printer.ip}:{printer.port}
                                    </IonText>
                                    {printer.model && (
                                      <IonText color="medium" className="text-xs block">
                                        {printer.model}
                                      </IonText>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <IonBadge color={getPrinterStatusColor(printer.status)}>
                                      {printer.status}
                                    </IonBadge>
                                    {selectedPrinter?.ip === printer.ip && (
                                      <IonIcon icon={checkmark} color="success" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </IonItem>
                          ))}
                        </IonList>
                      </div>
                    )}

                    {/* Manual Configuration */}
                    <div className="mt-4">
                      <IonText color="dark" className="text-sm font-medium block mb-2">
                        Hoặc nhập thủ công:
                      </IonText>
                      
                      <IonItem>
                        <IonLabel position="stacked">Địa chỉ IP máy in</IonLabel>
                        <IonInput
                          value={printerConfig.ipAddress}
                          placeholder="192.168.1.135"
                          onIonInput={(e) => handlePrinterConfigChange('ipAddress', e.detail.value!)}
                        />
                      </IonItem>

                      <IonItem>
                        <IonLabel position="stacked">Cổng (Port)</IonLabel>
                        <IonInput
                          type="number"
                          value={printerConfig.port}
                          placeholder="9100"
                          onIonInput={(e) => handlePrinterConfigChange('port', parseInt(e.detail.value!))}
                        />
                      </IonItem>

                      <div className="mt-4">
                        <IonButton
                          expand="block"
                          fill="outline"
                          onClick={handleTestConnection}
                          disabled={isLoading}
                        >
                          <IonIcon icon={wifi} slot="start" />
                          Kiểm tra kết nối
                        </IonButton>
                      </div>
                    </div>

                    <IonText color="medium" className="text-xs mt-4 block">
                      💡 Hướng dẫn: Đảm bảo máy in Xprinter 365B đã kết nối mạng và proxy server đang chạy (yarn printer-proxy)
                    </IonText>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          )}

          {/* Print Controls */}
          <div className="w-full space-y-4">
            <IonItem className="rounded-xl">
              <IonLabel position="stacked">Số lượng in (1-100)</IonLabel>
              <IonInput
                type="number"
                value={printQuantity}
                min="1"
                max="100"
                onIonInput={(e) => handleQuantityChange(e.detail.value!)}
              />
            </IonItem>

            <div className="flex gap-3">
              <IonButton
                expand="block"
                onClick={handlePrint}
                disabled={!productCode || isLoading}
                className="flex-1"
              >
                <IonIcon icon={printOutline} slot="start" />
                {useNetworkPrinter ? 'In qua mạng (Code128)' : 'In qua trình duyệt'}
              </IonButton>
            </div>

            {useNetworkPrinter && (
              <IonText color="success" className="text-xs text-center block">
                🏷️ Sẽ in nhãn 35x22mm tối ưu cho Xprinter 365B với mã Code128
              </IonText>
            )}
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default BarcodeModal;
