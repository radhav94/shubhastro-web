import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const userId = "647791";
const apiKey = "028d305879f503481d151369c052e93b371a5376";
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const astroTarotApi = createApi({
  reducerPath: "astroTarotApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://json.astrologyapi.com/v1/",
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
