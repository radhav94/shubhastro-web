import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "../auth/authSlice";
import formReducer from "../kundliform/formSlice";
import { baseApi } from "../api/baseApi/baseApi";
import {
  localReuqqestApi,
  privateRequestNew,
} from "../../services/appServices/privateRequestNew";
import { pythonApi } from "../api/baseApi/pythonApi";
import { horoscopeApi } from "../api/baseApi/horoscopeBaseApi";
import { vedicApi } from "../api/baseApi/vedicApi";
import { astroTarotApi } from "../api/tarot/astroTarotApi";
import { geoApi } from "../api/geoApi";
import { calculatorApi } from "../api/baseApi/calculatorApi";
import { logoutAction } from "./logoutAction";

const appReducer = combineReducers({
  auth: authReducer,
  form: formReducer,
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

export const rootReducer = (state, action) => {
  if (action.type === logoutAction.type) {
    state = undefined;
  }
  return appReducer(state, action);
};
