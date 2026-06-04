import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const calculatorApi = createApi({
  reducerPath: "calculatorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "/main/api/astro/v3-json",
  }),
  endpoints: () => ({}),
});
