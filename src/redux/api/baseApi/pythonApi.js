import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const pythonApi = createApi({
  reducerPath: 'pythonApi',
  baseQuery: fetchBaseQuery({
    baseUrl: "/chart/api/astrology/",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
