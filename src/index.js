import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./theme/AuthContext";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

import { NotificationProvider } from "./theme/NotificationContext";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
     <AuthProvider>
      <NotificationProvider   wsUrl={null}  apiUrl={null}>
        <App />
      </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
