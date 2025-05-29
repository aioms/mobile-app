import { IonApp, setupIonicReact } from "@ionic/react";

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
import { useEffect } from "react";
import { Routes } from "./routes";
import { initStorage } from "./hooks";
import { Toast } from "@capacitor/toast";

setupIonicReact();

const App: React.FC = () => {
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await initStorage();
        console.log("Ionic Storage initialized successfully");
      } catch (error) {
        await Toast.show({
          text: "Failed to initialize Ionic Storage",
          duration: "long",
          position: "center",
        });
      }
    };

    initializeStorage();
  }, []);

  return (
    <IonApp>
      <Routes />
    </IonApp>
  );
};

export default App;
