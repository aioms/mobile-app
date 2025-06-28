import React from "react";
import { IonApp, setupIonicReact, useIonToast } from "@ionic/react";
import { ErrorBoundary } from "react-error-boundary";

/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
import "@ionic/react/css/palettes/dark.class.css";
// import "@ionic/react/css/palettes/dark.system.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/tailwind.css";
import "./theme/common.css";

/* Components */
import { Routes } from "./routes";
import FallbackError from "./components/FallbackError";

setupIonicReact();

const App: React.FC = () => {
  const [presentToast] = useIonToast();

  return (
    <ErrorBoundary
      FallbackComponent={FallbackError}
      onReset={(details) => {
        // Reset the state of your app so the error doesn't happen again
        console.log("Error boundary reset:", details);
        presentToast({
          message: `App has been reset. Please try again. ${details.reason}`,
          duration: 2000,
          position: "top",
          color: "warning",
        });
      }}
      onError={(error, errorInfo) => {
        // Log error to your error reporting service
        console.error("Error caught by boundary:", error, errorInfo);
      }}
    >
      <IonApp>
        <Routes />
      </IonApp>
    </ErrorBoundary>
  );
};

export default App;
