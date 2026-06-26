import { createApi } from '@reduxjs/toolkit/query/react';
import { createSecureBaseQuery } from '../../../utils/security/secureBaseQuery';
import { PYTHON_PROXY } from '../../../utils/apiConfig';

export const pythonApi = createApi({
  reducerPath: 'pythonApi',
  baseQuery: createSecureBaseQuery({
    baseUrl: `${PYTHON_PROXY}/api/astrology/`,
    prepareHeaders: (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept-Language", "en");
      return headers;
    },
  }),
  endpoints: () => ({}),
});
