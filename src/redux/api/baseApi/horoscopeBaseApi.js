import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const userId = "646670";
const apiKey = "29e194e8a38c46b123968bb8e01c32b13633c1de";
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const horoscopeApi = createApi({
  reducerPath: 'horoscopeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: "https://json.astrologyapi.com/v1/",
    prepareHeaders: (headers) => {
      headers.set("Authorization", auth);
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
