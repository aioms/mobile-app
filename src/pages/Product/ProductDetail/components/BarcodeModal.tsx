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
  IonProgressBar,
} from "@ionic/react";
import {
  close,
  printOutline,
  barcode,
  settings,
  wifi,
  search,
  checkmark,
  copyOutline
} from "ionicons/icons";
import { useLoading } from "@/hooks";
import { createXprinterService, DEFAULT_XPRINTER_CONFIG } from "@/helpers/printerService";
import { PrinterConfig } from "@/types/printer";
import { PrintingStatus } from "@/types/barcodeModal";
import LocalNetworkService from "@/services/localNetworkService";
import { PrinterDevice } from "@/types/localNetwork";

interface BarcodeModalProps {
  isOpen: boolean;
  onDidDismiss: () => void;
  productName?: string;
  productCode?: string;
}

const BarcodeModal: React.FC<BarcodeModalProps> = ({
  isOpen,
  onDidDismiss,
  productName,
  productCode
}) => {
  const barcodeRef = useRef<HTMLDivElement>(null);
  const { isLoading, withLoading } = useLoading();
  const [presentToast] = useIonToast();

  // State management for single product printing
  const [printQuantity, setPrintQuantity] = useState<number>(1);
  const [useNetworkPrinter, setUseNetworkPrinter] = useState<boolean>(false);
  const [showPrinterSettings, setShowPrinterSettings] = useState<boolean>(false);
  const [showDiscovery, setShowDiscovery] = useState<boolean>(false);

  const [printingStatus, setPrintingStatus] = useState<PrintingStatus>({
    status: 'idle',
    progress: { current: 0, total: 0, message: '' }
  });

  // Printer configuration state
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    ipAddress: DEFAULT_XPRINTER_CONFIG.ipAddress || '192.168.1.135',
    port: DEFAULT_XPRINTER_CONFIG.port || 9100,
    timeout: DEFAULT_XPRINTER_CONFIG.timeout || 5000,
  });

  const [discoveredPrinters, setDiscoveredPrinters] = useState<PrinterDevice[]>([]);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);

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
        message: "Không có mã sản phẩm để in",
        duration: 2000,
        position: "top",
        color: "warning",
      });
      return;
    }

    await withLoading(async () => {
      try {
        const printerService = createXprinterService(printerConfig);

        // Update printing status
        setPrintingStatus({
          status: 'preparing',
          progress: { current: 0, total: 1, message: 'Đang chuẩn bị in...' }
        });

        // Single product printing using the updated printHorizontalBarcodes method
        setPrintingStatus({
          status: 'printing',
          progress: { current: 1, total: 1, message: `Đang in ${productName || productCode}...` }
        });

        const product = {
          productCode: productCode,
          productName: productName || productCode
        };

        const response = await printerService.printHorizontalBarcodes(product, printQuantity);

        if (response.success) {
          setPrintingStatus({
            status: 'completed',
            progress: { current: 1, total: 1, message: 'In thành công!' }
          });

          await presentToast({
            message: `In thành công ${printQuantity} mã vạch`,
            duration: 3000,
            position: "top",
            color: "success",
          });
        } else {
          throw new Error(response.message);
        }

        // Reset status after delay
        setTimeout(() => {
          setPrintingStatus({
            status: 'idle',
            progress: { current: 0, total: 0, message: '' }
          });
        }, 2000);
      } catch (error) {
        setPrintingStatus({
          status: 'error',
          progress: { current: 0, total: 1, message: 'Lỗi khi in' }
        });

        await presentToast({
          message: (error as Error).message,
          duration: 3000,
          position: "top",
          color: "danger",
        });

        // Reset status after delay
        setTimeout(() => {
          setPrintingStatus({
            status: 'idle',
            progress: { current: 0, total: 0, message: '' }
          });
        }, 2000);
      }
    });
  };

  const handleBrowserPrint = async () => {
    try {
      if (!productCode) {
        await presentToast({
          message: "Không có mã sản phẩm để in",
          duration: 2000,
          position: "top",
          color: "warning",
        });
        return;
      }

      // Update printing status
      setPrintingStatus({
        status: 'preparing',
        progress: { current: 0, total: 1, message: 'Đang chuẩn bị in...' }
      });

      if (barcodeRef.current && printQuantity > 0) {
        // Handle single barcode printing
        setPrintingStatus({
          status: 'printing',
          progress: { current: 1, total: 1, message: 'Đang in mã vạch...' }
        });

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

        setPrintingStatus({
          status: 'completed',
          progress: { current: 1, total: 1, message: 'In thành công!' }
        });

        await presentToast({
          message: `In thành công mã vạch với số lượng ${printQuantity}`,
          duration: 3000,
          position: "top",
          color: "success",
        });
      }

      // Reset status after delay
      setTimeout(() => {
        setPrintingStatus({
          status: 'idle',
          progress: { current: 0, total: 0, message: '' }
        });
      }, 2000);

    } catch (error) {
      console.error('Browser print error:', error);
      setPrintingStatus({
        status: 'error',
        progress: { current: 0, total: 0, message: 'Lỗi khi in' }
      });

      await presentToast({
        message: `Lỗi in mã vạch: ${(error as Error).message}`,
        duration: 3000,
        position: "top",
        color: "danger",
      });

      // Reset status after error
      setTimeout(() => {
        setPrintingStatus({
          status: 'idle',
          progress: { current: 0, total: 0, message: '' }
        });
      }, 3000);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await presentToast({
        message: "Đã sao chép mã vạch",
        duration: 1000,
        position: "top",
        color: "success",
      });
    } catch (error) {
      await presentToast({
        message: "Không thể sao chép mã vạch",
        duration: 2000,
        position: "top",
        color: "danger",
      });
    }
  };

  const renderPrintingStatus = () => {
    if (printingStatus.status === 'idle') return null;

    const getStatusColor = () => {
      switch (printingStatus.status) {
        case 'preparing': return 'primary';
        case 'printing': return 'warning';
        case 'completed': return 'success';
        case 'error': return 'danger';
        default: return 'medium';
      }
    };

    const getStatusIcon = () => {
      switch (printingStatus.status) {
        case 'preparing': return <IonSpinner name="crescent" />;
        case 'printing': return <IonSpinner name="crescent" />;
        case 'completed': return <IonIcon icon={checkmark} />;
        case 'error': return <IonIcon icon={close} />;
        default: return null;
      }
    };

    return (
      <IonCard className="mb-4">
        <IonCardContent>
          <div className="flex items-center space-x-3">
            <div className={`text-${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <IonText color={getStatusColor()}>
                <p className="font-medium">{printingStatus.progress.message}</p>
              </IonText>
              {printingStatus.progress.total > 0 && (
                <IonProgressBar
                  value={printingStatus.progress.current / printingStatus.progress.total}
                  color={getStatusColor()}
                  className="mt-2"
                />
              )}
            </div>
          </div>
        </IonCardContent>
      </IonCard>
    );
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDidDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mã vạch sản phẩm</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDidDismiss}>
              <IonIcon icon={close} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Printing Status */}
        {renderPrintingStatus()}

        {/* Barcode Display */}
        <IonCard className="mb-4">
          <IonCardHeader>
            <IonCardTitle className="text-center">
              <IonIcon icon={barcode} className="mr-2" />
              Mã vạch
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div className="text-center mb-4">
              <div ref={barcodeRef} className="inline-block">
                {productCode && (
                  <Barcode
                    value={productCode}
                    format="CODE128"
                    width={2}
                    height={50}
                    displayValue={true}
                    fontSize={12}
                    margin={10}
                  />
                )}
              </div>
            </div>

            {productName && (
              <div className="text-center mb-4">
                <IonText>
                  <h3 className="font-medium">{productName}</h3>
                </IonText>
              </div>
            )}

            <div className="text-center">
              <IonButton
                fill="outline"
                size="small"
                onClick={() => productCode && copyToClipboard(productCode)}
                disabled={!productCode}
              >
                <IonIcon icon={copyOutline} slot="start" />
                Sao chép mã
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Print Settings */}
        <IonCard className="mb-4">
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={settings} className="mr-2" />
              Cài đặt in
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {/* Print Quantity */}
            <IonItem className="mb-4">
              <IonLabel position="stacked">Số lượng in</IonLabel>
              <IonInput
                type="number"
                value={printQuantity}
                onIonInput={(e) => handleQuantityChange(e.detail.value!)}
                min={1}
                max={100}
                placeholder="Nhập số lượng"
              />
            </IonItem>

            {/* Network Printer Toggle */}
            <IonItem className="mb-4">
              <IonLabel>
                <h3>Sử dụng máy in mạng</h3>
                <p>In qua máy in Xprinter 365B</p>
              </IonLabel>
              <IonToggle
                checked={useNetworkPrinter}
                onIonChange={(e) => setUseNetworkPrinter(e.detail.checked)}
              />
            </IonItem>

            {/* Network Printer Settings */}
            {useNetworkPrinter && (
              <>
                <div className="mb-4">
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={() => setShowPrinterSettings(!showPrinterSettings)}
                  >
                    <IonIcon icon={settings} slot="start" />
                    Cài đặt máy in
                  </IonButton>
                </div>

                {showPrinterSettings && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <IonItem className="mb-2">
                      <IonLabel position="stacked">Địa chỉ IP</IonLabel>
                      <IonInput
                        value={printerConfig.ipAddress}
                        onIonInput={(e) => handlePrinterConfigChange('ipAddress', e.detail.value!)}
                        placeholder="192.168.1.220"
                      />
                    </IonItem>

                    <IonItem className="mb-2">
                      <IonLabel position="stacked">Cổng</IonLabel>
                      <IonInput
                        type="number"
                        value={printerConfig.port}
                        onIonInput={(e) => handlePrinterConfigChange('port', parseInt(e.detail.value!))}
                        placeholder="9100"
                      />
                    </IonItem>

                    <IonItem className="mb-4">
                      <IonLabel position="stacked">Timeout (ms)</IonLabel>
                      <IonInput
                        type="number"
                        value={printerConfig.timeout}
                        onIonInput={(e) => handlePrinterConfigChange('timeout', parseInt(e.detail.value!))}
                        placeholder="5000"
                      />
                    </IonItem>

                    <div className="flex space-x-2">
                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={handleTestConnection}
                        disabled={isLoading}
                      >
                        <IonIcon icon={wifi} slot="start" />
                        Kiểm tra kết nối
                      </IonButton>

                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={handleDiscoverPrinters}
                        disabled={isDiscovering}
                      >
                        <IonIcon icon={search} slot="start" />
                        {isDiscovering ? <IonSpinner name="crescent" /> : 'Tìm máy in'}
                      </IonButton>
                    </div>
                  </div>
                )}

                {/* Selected Printer Info */}
                {selectedPrinter && (
                  <IonCard className="mb-4">
                    <IonCardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <IonText>
                            <h3 className="font-medium">{selectedPrinter.name || 'Máy in'}</h3>
                            <p className="text-sm text-gray-600">{selectedPrinter.ip}:{selectedPrinter.port}</p>
                          </IonText>
                        </div>
                        <IonBadge color={selectedPrinter.status === 'online' ? 'success' : 'warning'}>
                          {selectedPrinter.status === 'online' ? 'Đã kết nối' : 'Offline'}
                        </IonBadge>
                      </div>
                    </IonCardContent>
                  </IonCard>
                )}
              </>
            )}
          </IonCardContent>
        </IonCard>

        {/* Print Button */}
        <IonButton
          expand="block"
          onClick={handlePrint}
          disabled={isLoading || !productCode || printingStatus.status === 'printing'}
          className="mb-4"
        >
          <IonIcon icon={printOutline} slot="start" />
          {printingStatus.status === 'printing' ? 'Đang in...' : `In ${printQuantity} mã vạch`}
        </IonButton>

        {/* Printer Discovery Modal */}
        <IonModal isOpen={showDiscovery} onDidDismiss={() => setShowDiscovery(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Chọn máy in</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDiscovery(false)}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              {discoveredPrinters.map((printer, index) => (
                <IonItem
                  key={index}
                  button
                  onClick={() => handleSelectPrinter(printer)}
                >
                  <IonLabel>
                    <h3>{printer.name || `Máy in ${index + 1}`}</h3>
                    <p>{printer.ip}:{printer.port}</p>
                    {printer.model && <p className="text-sm text-gray-600">{printer.model}</p>}
                  </IonLabel>
                  <IonBadge color={printer.isOnline ? 'success' : 'warning'} slot="end">
                    {printer.isOnline ? 'Online' : 'Offline'}
                  </IonBadge>
                </IonItem>
              ))}
            </IonList>

            {discoveredPrinters.length === 0 && (
              <div className="text-center py-8">
                <IonText color="medium">
                  <p>Không tìm thấy máy in nào</p>
                </IonText>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonModal>
  );
};

export default BarcodeModal;
