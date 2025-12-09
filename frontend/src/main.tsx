import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HousingContextProvider from "./contexts/housingContext";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HousingContextProvider>
        <App />
      </HousingContextProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
