import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";

export const calculatorApi = createApi({
  reducerPath: "calculatorApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: "/main/api/astro/v3-json",
  }),
  endpoints: () => ({}),
});
