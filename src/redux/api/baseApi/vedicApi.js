// src/redux/api/vedicApi/vedicApi.js

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_APP_API_BASE_URL;

export const vedicApi = createApi({
  reducerPath: "vedicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${BASE_URL}/api/astro/v3-json/`,
  }),
  endpoints: () => ({}),
});
