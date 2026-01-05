import {
  localReuqqestApi,
  privateRequestNew,
} from "../../services/appServices/privateRequestNew";
import { baseApi } from "../api/baseApi/baseApi";
import { calculatorApi } from "../api/baseApi/calculatorApi";
import { horoscopeApi } from "../api/baseApi/horoscopeBaseApi";
import { pythonApi } from "../api/baseApi/pythonApi";
import { vedicApi } from "../api/baseApi/vedicApi";
import { geoApi } from "../api/geoApi";
import { astroTarotApi } from "../api/tarot/astroTarotApi";
import { clearForm } from "../kundliform/formSlice";

export const clearFormAndCache = () => (dispatch) => {
  // 1️⃣ Clear form slice
  dispatch(clearForm());

  // 2️⃣ Clear ALL RTK Query cache
  dispatch(baseApi.util.resetApiState());
  dispatch(pythonApi.util.resetApiState());
  dispatch(horoscopeApi.util.resetApiState());
  dispatch(vedicApi.util.resetApiState());
  dispatch(astroTarotApi.util.resetApiState());
  dispatch(geoApi.util.resetApiState());
  dispatch(calculatorApi.util.resetApiState());
  dispatch(privateRequestNew.util.resetApiState());
  dispatch(localReuqqestApi.util.resetApiState());
};
