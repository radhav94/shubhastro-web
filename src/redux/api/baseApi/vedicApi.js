// src/redux/api/vedicApi/vedicApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Keep API key configurable (env recommended later)
export const VEDIC_API_KEY = "5b36ad1f-34bf-5d25-84a0-6ff9bddd3089";

export const vedicApi = createApi({
  reducerPath: "vedicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "https://api.vedicastroapi.com/v3-json/",
  }),
  endpoints: () => ({}),
});
