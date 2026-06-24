import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";

const userId = import.meta.env.VITE_TAROT_API_USER_ID;
const apiKey = import.meta.env.VITE_TAROT_API_KEY;
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const astroTarotApi = createApi({
  reducerPath: "astroTarotApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: "/vedic/v1/",
    prepareHeaders: (headers) => {
      headers.set("Authorization", auth);
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: (builder) => ({
    postYesNoTarot: builder.query({
      query: (id) => ({
        url: "yes_no_tarot",
        method: "POST",
        body: id,
      }),
    }),
  }),
});

export const { usePostYesNoTarotQuery } = astroTarotApi;
