import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/auth/authSlice";
import formReducer from "../redux/kundliform/formSlice";
import aiwowReducer from "../redux/aiwow/aiwowSlice";
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
export const store = configureStore({
  reducer: {
    auth: authReducer,
    form: formReducer,
    aiwow: aiwowReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [privateRequestNew.reducerPath]: privateRequestNew.reducer,
    [localReuqqestApi.reducerPath]: localReuqqestApi.reducer,
    [pythonApi.reducerPath]: pythonApi.reducer,
    [horoscopeApi.reducerPath]: horoscopeApi.reducer,
    [vedicApi.reducerPath]: vedicApi.reducer,
    [astroTarotApi.reducerPath]: astroTarotApi.reducer,
    [geoApi.reducerPath]: geoApi.reducer,
    [calculatorApi.reducerPath]: calculatorApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
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
