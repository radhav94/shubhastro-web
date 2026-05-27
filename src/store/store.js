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

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "kundli", "calculator"], // persist auth, kundli, and calculator slices
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
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
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
      .concat(calculatorApi.middleware),
});

export const persistor = persistStore(store);
