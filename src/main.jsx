import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./global.css";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "./store/store.js";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
    <Provider store={store} >
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        style: {
          fontFamily: "Poppins",
          fontSize: "14px",
        },
      }}
    />
    <App />
    </Provider>
  // </StrictMode>
);
