import "leaflet/dist/leaflet.css";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { NotificationProvider } from './contexts/NotificationContext';// ✅ Added

// Import service worker
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <NotificationProvider> {/* ✅ Wrap App so all components can access notifications */}
      <App />
    </NotificationProvider>
  </React.StrictMode>
);

// Register service worker (enables PWA + offline support)
serviceWorkerRegistration.register();