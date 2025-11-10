import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../redux/auth/authSlice";
import formReducer from "../redux/kundliform/formSlice";
import { baseApi } from "../redux/api/baseApi/baseApi";
import { pythonApi } from "../redux/api/baseApi/pythonApi";
import { horoscopeApi } from "../redux/api/baseApi/horoscopeBaseApi";
import { vedicApi } from "../redux/api/baseApi/vedicApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    form: formReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    [pythonApi.reducerPath]: pythonApi.reducer,
    [horoscopeApi.reducerPath]: horoscopeApi.reducer,
    [vedicApi.reducerPath]: vedicApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      //   serializableCheck: false,
    })
      // Include all middlewares here
      .concat(baseApi.middleware)
      .concat(pythonApi.middleware)
      .concat(horoscopeApi.middleware)
      .concat(vedicApi.middleware),
});
