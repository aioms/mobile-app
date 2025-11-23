import React, { useEffect } from "react";
import { IonApp, setupIonicReact, useIonToast } from "@ionic/react";
import { PostHogErrorBoundary, usePostHog } from "posthog-js/react";

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
import { getEnvironment } from "./helpers/common";

setupIonicReact();

const App: React.FC = () => {
  const [presentToast] = useIonToast();
  const posthog = usePostHog()

  useEffect(() => {
    const environment = getEnvironment();
    posthog?.capture('init', { environment })
  }, [])

  return (
    <PostHogErrorBoundary
      fallback={({ error }) => (
        <FallbackError
          error={error}
          resetErrorBoundary={() => {
            console.log("Error boundary reset");
            presentToast({
              message: "App has been reset. Please try again.",
              duration: 2000,
              position: "top",
              color: "warning",
            });
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
        />
      )}
    >
      <IonApp>
        <Routes />
      </IonApp>
    </PostHogErrorBoundary>
  );
};

export default App;
