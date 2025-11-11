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

// Add error boundary for better debugging
const RootComponent = () => {
  return (
    <BrowserRouter>
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
};

// Simple error boundary for debugging
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#e53e3e' }}>Something went wrong</h1>
          <p>Error: {this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));

try {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <RootComponent />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("✅ React app mounted successfully");
} catch (error) {
  console.error("❌ Failed to mount React app:", error);
  // Fallback rendering
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #e53e3e;">Failed to load application</h1>
        <p>Please check the console for errors and refresh the page.</p>
        <button onclick="window.location.reload()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Reload Page
        </button>
        <p><small>Error: ${error.message}</small></p>
      </div>
    `;
  }
}

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