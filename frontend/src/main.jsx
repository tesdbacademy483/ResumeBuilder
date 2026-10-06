import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { FeedbackProvider } from "./components/Feedback";
import { AuthProvider } from "./context/AuthContext";
import "./styles/theme.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);