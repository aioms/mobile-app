import React from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import { addIcons } from "ionicons";
import { flashlight, stop, search } from "ionicons/icons";
import App from "./App";

import { PostHogProvider } from "posthog-js/react";

// import * as Sentry from "@sentry/capacitor";
// import * as SentryReact from "@sentry/react";
// import { Environment } from "./common/enums";
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
  // Sentry.init(
  //   {
  //     dsn: envConfig.VITE_SENTRY_DSN,
  //     sendDefaultPii: true,
  //     // Set your release version, such as "getsentry@1.0.0"
  //     release: "aiom-mobile@1.0.0",
  //     integrations: [Sentry.browserTracingIntegration()],
  //     // Tracing
  //     tracesSampleRate: 1.0, //  Capture 100% of the transactions

  //     environment,
  //     tracePropagationTargets: [
  //       "localhost",
  //       /^https:\/\/aioms-api\.deno\.dev/,
  //       /^https:\/\/aioms-api\.deno\.dev\/api\/v1/,
  //       /^https:\/\/aioms-api-stg\.deno\.dev/,
  //       /^https:\/\/aioms-api-stg\.deno\.dev\/api\/v1/,
  //     ],
  //   },
  //   // Forward the init method from @sentry/react
  //   SentryReact.init
  // );

  root.render(
    <React.StrictMode>
      <PostHogProvider
        apiKey={envConfig.VITE_PUBLIC_POSTHOG_KEY}
        options={{
          api_host: envConfig.VITE_PUBLIC_POSTHOG_HOST,
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
