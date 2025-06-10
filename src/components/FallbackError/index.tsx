import React from "react";
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonPage,
  IonText,
} from "@ionic/react";
import { refreshOutline, bugOutline } from "ionicons/icons";
import { FallbackProps } from "react-error-boundary";

const FallbackError: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const handleReload = () => {
    // Clear any cached data if needed
    localStorage.clear();
    sessionStorage.clear();

    // Reset the error boundary
    resetErrorBoundary();

    // Reload the page as a last resort
    if (typeof window !== "undefined") {
      window?.location?.reload();
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="flex flex-col items-center justify-center min-h-full">
          <IonCard className="w-full max-w-md">
            <IonCardHeader className="text-center">
              <IonIcon
                icon={bugOutline}
                className="text-6xl text-red-500 mb-4"
              />
              <IonCardTitle className="text-xl font-bold text-red-600">
                Oops! Something went wrong
              </IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <IonText className="block text-center mb-4">
                <p className="text-gray-600">
                  We're sorry, but something unexpected happened. Please try
                  refreshing the app.
                </p>
              </IonText>

              {process.env.NODE_ENV === "development" && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                  <IonText>
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      Error Details:
                    </p>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                      {error.message}
                    </pre>
                  </IonText>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <IonButton
                  expand="block"
                  color="primary"
                  onClick={resetErrorBoundary}
                >
                  <IonIcon icon={refreshOutline} slot="start" />
                  Thử lại
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={handleReload}
                >
                  Reload App
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default FallbackError;
