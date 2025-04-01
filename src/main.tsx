import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
// import { PostHogProvider } from "posthog-js/react";

// Call the element loader after the platform has been bootstrapped
defineCustomElements(window);

const container = document.getElementById("root");
if (!container) {
  console.error("Root container not found");
} else {
  console.log("Root container found, rendering app");
}
const root = createRoot(container!);

// const options = {
//   api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
// };

root.render(
  <React.StrictMode>
    {/* <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}
    > */}
    <App />
    {/* </PostHogProvider> */}
  </React.StrictMode>
);
