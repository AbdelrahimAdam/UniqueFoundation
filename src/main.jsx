import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import App from "./App.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";
import "./i18n";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    mutations: { retry: 1 },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter basename={import.meta.env.BASE_URL || "/"}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  </BrowserRouter>
);

// Service Worker registration + update handling
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ SW registered:", registration);

      // Listen for updates
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("🔄 New version available. Refresh to update.");
              // Optional: auto reload
              // window.location.reload();
            }
          });
        }
      });
    } catch (err) {
      console.warn("⚠️ SW registration failed:", err);
    }
  });
}

// PWA install prompt handling
let deferredPrompt;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Auto-show a custom install button
  const btn = document.createElement("button");
  btn.textContent = "📲 Install Unique Foundation";
  btn.style = `
    position:fixed; bottom:20px; right:20px;
    background:#667eea; color:white; border:none;
    padding:12px 16px; border-radius:8px;
    box-shadow:0 2px 6px rgba(0,0,0,0.2);
    cursor:pointer; z-index:10000; font-weight:600;
  `;
  document.body.appendChild(btn);

  btn.addEventListener("click", async () => {
    btn.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("User response:", outcome);
    deferredPrompt = null;
  });
});
