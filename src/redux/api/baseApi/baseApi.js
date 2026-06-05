import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const userId = import.meta.env.VITE_VEDIC_API_USER_ID;
const apiKey = import.meta.env.VITE_VEDIC_API_KEY;
const auth = `Basic ${btoa(userId + ":" + apiKey)}`;

export const baseApi = createApi({
  reducerPath: 'astrologyApi',
  baseQuery: fetchBaseQuery({
    baseUrl: "/vedic/v1/",
    prepareHeaders: (headers) => {
      headers.set("Authorization", auth);
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
