import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const vedicApi = createApi({
  reducerPath: "vedicApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/main/api/astro/v3-json/",
  }),
  endpoints: () => ({}),
});
