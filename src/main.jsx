// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";

// import App from "./App.jsx";
// import "./global.css";
// import { Toaster } from "react-hot-toast";
// import { Provider } from "react-redux";
// import { store } from "./store/store.js";

// createRoot(document.getElementById("root")).render(
//   // <StrictMode>
//     <Provider store={store} >
//     <Toaster
//       position="top-right"
//       reverseOrder={false}
//       toastOptions={{
//         style: {
//           fontFamily: "Poppins",
//           fontSize: "14px",
//         },
//       }}
//     />
//     <App />
//     </Provider>
//   // </StrictMode>
// );


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./global.css";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store.js";
import { PersistGate } from "redux-persist/integration/react";

import { AgoraProvider } from "./agora/agoraClient";  // <-- IMPORTANT

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  // <AgoraProvider>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster
          position="top-right"
          reverseOrder={false}
          containerStyle={{
            zIndex: 10000000,
          }}
          toastOptions={{
            style: {
              fontFamily: "Poppins",
              fontSize: "14px",
              zIndex: 10000000,
            },
          }}
        />

        <App />
      </PersistGate>
    </Provider>
  // </AgoraProvider>
  // </StrictMode>
);
