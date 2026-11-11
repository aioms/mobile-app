import React, { useState } from "react";
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
  RefresherEventDetail,
} from "@ionic/react";
import { Refresher } from "@/components/Refresher/Refresher";
import LoadingScreen from "@/components/Loading/LoadingScreen";
import AppInfoSection from "./components/AppInfoSection";
import NotificationSection from "./components/NotificationSection";
import PrinterConfigModal from "./components/PrinterConfigModal";
import PrinterSettingSection from "./components/PrinterSettingSection";
import ScannerSettingSection from "./components/ScannerSettingSection";
import StorageAndCacheSection from "./components/StorageAndCacheSection";
import { useDeviceSettings } from "./hooks/useDeviceSettings";

const SettingListPage: React.FC = () => {
  const {
    settings,
    isInitialLoading,
    isSaving,
    reload,
    updatePrinterSettings,
    updateScannerSettings,
  } = useDeviceSettings();
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  const handleRefresh = async (
    event: CustomEvent<RefresherEventDetail>
  ): Promise<void> => {
    try {
      await reload();
    } finally {
      event.detail.complete();
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border border-b border-gray-100">
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Cài đặt</IonTitle>
          {isSaving && (
            <IonButtons slot="end">
              <IonSpinner name="crescent" className="w-5 h-5 text-blue-600" />
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent className="bg-gray-50">
        <Refresher onRefresh={handleRefresh} />

        {isInitialLoading ? (
          <LoadingScreen message="Đang tải cài đặt..." />
        ) : (
          <div className="px-4 pt-4 pb-20">
            <PrinterSettingSection
              settings={settings.printer}
              onOpenConfig={() => setIsPrinterModalOpen(true)}
            />
            <ScannerSettingSection
              settings={settings.scanner}
              onChange={updateScannerSettings}
            />
            <NotificationSection />
            <StorageAndCacheSection />
            <AppInfoSection />
          </div>
        )}

        <PrinterConfigModal
          isOpen={isPrinterModalOpen}
          settings={settings.printer}
          onDismiss={() => setIsPrinterModalOpen(false)}
          onSave={updatePrinterSettings}
        />
      </IonContent>
    </IonPage>
  );
};

export default SettingListPage;
