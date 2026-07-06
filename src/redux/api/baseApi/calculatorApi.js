import { createApi } from "@reduxjs/toolkit/query/react";
import { createSecureBaseQuery } from "../../../utils/security/secureBaseQuery";
import { BACKEND_PROXY } from "../../../utils/apiConfig";

export const calculatorApi = createApi({
  reducerPath: "calculatorApi",
  baseQuery: createSecureBaseQuery({
    baseUrl: `${BACKEND_PROXY}/api/astro/v3-json`,
  }),
  endpoints: () => ({}),
});
