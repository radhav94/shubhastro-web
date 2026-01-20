import { useNavigate } from "react-router-dom";
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
  const role = localStorage.getItem("shubhtalk_role");

  if (role === "ASTROLOGER") {
    localStorage.removeItem("shubhtalk_astro_token");
    localStorage.removeItem("shubhtalk_astro_id");
  }

  if (role === "CUSTOMER") {
    localStorage.removeItem("shubhtalk_customer_token");
    localStorage.removeItem("shubhtalk_customer_id");
    localStorage.removeItem("shubhtalk_customer_wallet");
  }
  localStorage.removeItem("shubhtalk_role");

  localStorage.removeItem("age_calculator");
  localStorage.removeItem("atmakaraka-and-darakaraka");
  localStorage.removeItem("birth_natal_calc");
  localStorage.removeItem("dasha_calc");
  localStorage.removeItem("destiny_calc");
  localStorage.removeItem("flames_calculator");
  localStorage.removeItem("friendship_calculator");
  localStorage.removeItem("kaal_sarp");
  localStorage.removeItem("love_calculator");
  localStorage.removeItem("mangal_dosha");
  localStorage.removeItem("mobile_calculator");
  localStorage.removeItem("numerology_report");
  localStorage.removeItem("rashi_moon_sign");
  localStorage.removeItem("rising_sign");
  localStorage.removeItem("shani_sade_sati");
  localStorage.removeItem("sun_sign");
  localStorage.removeItem("vehicle_calculator");

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
