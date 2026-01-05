import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const calculatorApi = createApi({
  reducerPath: "calculatorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `https://api.vedicastroapi.com/v3-json/`,
  }),
  endpoints: () => ({}),
});
