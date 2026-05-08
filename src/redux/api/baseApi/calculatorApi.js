import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const calculatorApi = createApi({
  reducerPath: "calculatorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `https://devapi-shubhtalk.epicon.in/api/astro/v3-json`,
  }),
  endpoints: () => ({}),
});
