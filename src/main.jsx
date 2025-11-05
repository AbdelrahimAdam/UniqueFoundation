import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import App from "./App.jsx";
import { AuthProvider } from "./hooks/useAuth.jsx";
import "./i18n";
import "./index.css";

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));

// Render App
root.render(
  // ⚡ React.StrictMode removed intentionally to avoid double effects in dev
  <BrowserRouter basename="/">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>

      {/* React Query Devtools only in development */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  </BrowserRouter>
);

// Optional: report web vitals (if you ever integrate analytics)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // Attempt to register service worker safely
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) =>
        console.log("✅ SW registered in main.jsx:", registration)
      )
      .catch((err) => console.warn("⚠️ SW registration failed:", err));
  });
}
