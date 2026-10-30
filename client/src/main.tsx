import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import App from "./App";
import AuthInitializer from "./components/layout/AuthInitializer";
import "./services/authenticatedRequest";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthInitializer>
        <App />
      </AuthInitializer>
    </BrowserRouter>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        className: "dark:!bg-slate-800 dark:!text-slate-100 dark:!border dark:!border-slate-700 shadow-md",
      }}
    />
  </QueryClientProvider>,
);
