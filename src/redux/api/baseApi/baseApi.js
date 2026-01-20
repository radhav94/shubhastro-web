import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const userId = "646670";
const apiKey = "2e402065d9ab99588046b881a81727b00c7138e5";
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const baseApi = createApi({
  reducerPath: 'astrologyApi',
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
