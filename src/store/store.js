import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";
import authReducer from "../redux/auth/authSlice";
import formReducer from "../redux/kundliform/formSlice";
import kundliReducer from "../redux/kundli/kundliSlice";
import aiwowReducer from "../redux/aiwow/aiwowSlice";
import remedyReducer from "../redux/remedy/remedySlice";
import calculatorReducer from "../redux/calculator/calculatorSlice";
import { baseApi } from "../redux/api/baseApi/baseApi";
import { pythonApi } from "../redux/api/baseApi/pythonApi";
import { horoscopeApi } from "../redux/api/baseApi/horoscopeBaseApi";
import { vedicApi } from "../redux/api/baseApi/vedicApi";
import { geoApi } from "../redux/api/geoApi";
import {
  localReuqqestApi,
  privateRequestNew,
} from "../services/appServices/privateRequestNew";
import { astroTarotApi } from "../redux/api/tarot/astroTarotApi";
import { calculatorApi } from "../redux/api/baseApi/calculatorApi";
import "../redux/api/plansApi/plansApi"; // inject endpoints into privateRequestNew
import "../redux/api/supportApi/supportApi"; // inject support endpoints
import "../redux/api/lalKitab/lalKitabApi"; // inject lal kitab endpoints
import "../redux/api/staticPages/staticPagesApi"; // inject static pages endpoints
import "../redux/api/community/communityApi"; // inject community feed endpoints
import { paymentDirectApi } from "../redux/api/payment/paymentApi";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["kundli", "calculator", "form"], // persist kundli, calculator, and form slices
};

// Persist aiwow results in sessionStorage (clears when tab closes)
const aiwowPersistConfig = {
  key: "aiwow",
  storage: storageSession,
  blacklist: [], // persist everything including results
};

const rootReducer = combineReducers({
  auth: authReducer,
  form: formReducer,
  kundli: kundliReducer,
  aiwow: persistReducer(aiwowPersistConfig, aiwowReducer),
  remedy: remedyReducer,
  calculator: calculatorReducer,
  [baseApi.reducerPath]: baseApi.reducer,
  [privateRequestNew.reducerPath]: privateRequestNew.reducer,
  [localReuqqestApi.reducerPath]: localReuqqestApi.reducer,
  [pythonApi.reducerPath]: pythonApi.reducer,
  [horoscopeApi.reducerPath]: horoscopeApi.reducer,
  [vedicApi.reducerPath]: vedicApi.reducer,
  [astroTarotApi.reducerPath]: astroTarotApi.reducer,
  [geoApi.reducerPath]: geoApi.reducer,
  [calculatorApi.reducerPath]: calculatorApi.reducer,
  [paymentDirectApi.reducerPath]: paymentDirectApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,

  /*
    Redux DevTools, development only.

    RTK's own default is `devTools = true` — unconditionally, with no NODE_ENV
    gate (see `devTools = true` in @reduxjs/toolkit/dist/redux-toolkit.modern.mjs,
    v2.10.0). This is a common misreading: because plain Redux's
    `composeWithDevTools` is usually wrapped in a NODE_ENV check by hand, people
    assume configureStore does the same. It does not. Verified in the shipped
    production bundle, where the minified configureStore reads
    `devTools:i=!0 ... i&&(v=Wi({trace:!1,...}))` — i.e. the DevTools enhancer was
    being installed on www.shubhastro.ai.

    What that exposed to any browser with the DevTools extension installed:
      - `state.auth.token`, the session token (authSlice keeps it in the store)
      - every RTK Query cache entry, which holds PLAINTEXT API responses — the
        secure gateway encrypts in transit but the client decrypts before the
        data reaches the cache, so the store is the one place it sits in the clear
      - the ability to dispatch arbitrary actions into a live session

    `import.meta.env.DEV` rather than `process.env.NODE_ENV`: this is a Vite
    build, DEV is a real boolean, and it is the flag already used elsewhere
    (main.jsx guards its boot-time test events with it). It is statically
    replaced at build time, so the enhancer is dropped from the production
    bundle rather than merely skipped at runtime.

    Note this only turns off the DEVTOOLS BRIDGE. Redux Toolkit itself stays —
    it is the entire state and data-fetching layer here (ten RTK Query APIs plus
    six slices), so it cannot be "switched off" for production.
  */
  devTools: import.meta.env.DEV,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/REGISTER",
        ],
      },
    })
      .concat(geoApi.middleware)
      .concat(baseApi.middleware)
      .concat(privateRequestNew.middleware)
      .concat(localReuqqestApi.middleware)
      .concat(pythonApi.middleware)
      .concat(horoscopeApi.middleware)
      .concat(vedicApi.middleware)
      .concat(astroTarotApi.middleware)
      .concat(calculatorApi.middleware)
      .concat(paymentDirectApi.middleware),
});

export const persistor = persistStore(store);
