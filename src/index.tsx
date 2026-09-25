import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import App from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
          <main className="mx-auto max-w-lg space-y-4 p-8 text-center">
            <h1 className="text-xl font-semibold">页面暂时无法显示</h1>
            <p className="text-sm text-slate-600">{error instanceof Error ? error.message : '请重新加载后再试。'}</p>
            <button className="rounded bg-blue-600 px-4 py-2 text-white" onClick={resetErrorBoundary}>重新加载</button>
          </main>
        )}
      >
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
);
