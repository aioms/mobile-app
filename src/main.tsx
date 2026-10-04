import React from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import { addIcons } from "ionicons";
import { flashlight, stop, search } from "ionicons/icons";
import App from "./App";
import { installClientErrorTracking } from "./helpers/api-telemetry";

import { PostHogProvider } from "posthog-js/react";

import { envConfig, getEnvironment } from "./helpers/common";
import { Environment } from "./common/enums";

addIcons({ flashlight, stop, search });

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);

const container = document.getElementById("root");
if (!container) {
  console.error("Root container not found");
} else {
  console.log("Root container found, rendering app");
}

const root = createRoot(container!);
const environment = getEnvironment();

if ([Environment.PRODUCTION, Environment.STAGING].includes(environment)) {
  root.render(
    <React.StrictMode>
      <PostHogProvider
        apiKey={envConfig.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: envConfig.VITE_PUBLIC_POSTHOG_HOST,
          capture_exceptions: false,
          loaded: (client) => { client.register({ source: "mobile", release: __APP_BUILD__.commit }); installClientErrorTracking(); },
          defaults: envConfig.VITE_PUBLIC_POSTHOG_DEFAULTS || "2025-05-24",
        }}
      >
        <App />
      </PostHogProvider>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
