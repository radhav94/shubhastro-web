import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";
import { ASTROLOGY_PROXY } from "../../../utils/apiConfig";

const userId = import.meta.env.VITE_VEDIC_API_USER_ID;
const apiKey = import.meta.env.VITE_HOROSCOPE_API_KEY;
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const horoscopeApi = createApi({
  reducerPath: "horoscopeApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: `${ASTROLOGY_PROXY}/v1/`,
    prepareHeaders: (headers) => {
      headers.set("Authorization", auth);
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
