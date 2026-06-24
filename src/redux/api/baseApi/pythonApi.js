import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '../../../utils/security/secureBaseQuery';

export const pythonApi = createApi({
  reducerPath: 'pythonApi',
  baseQuery: createSecureBaseQuery({
    baseUrl: "/chart/api/astrology/",
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
