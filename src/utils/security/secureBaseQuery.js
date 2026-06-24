/**
 * Secure base query for RTK Query.
 *
 * Wraps fetchBaseQuery so that, transparently to every endpoint:
 *   - the ECDH session is established and the `x-bff-sid` header is attached,
 *   - encrypted response envelopes from the BFF are decrypted back into the
 *     plain JSON the endpoints/transformResponse already expect.
 *
 * Decryption is envelope-shape gated: responses that are not BFF envelopes
 * (e.g. third-party hosts hit directly, or binary) pass through unchanged, so
 * this is safe to use on every base API including ones that bypass the BFF.
 */

import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ensureSession,
  getSessionId,
  isEncryptedEnvelope,
  decryptEnvelope,
} from "./cryptoClient";

/**
 * @param {object} options - the usual fetchBaseQuery options (baseUrl, prepareHeaders, ...)
 * @returns {(args, api, extraOptions) => Promise} an RTK Query baseQuery fn
 */
export function createSecureBaseQuery(options = {}) {
  const { prepareHeaders: userPrepareHeaders, ...rest } = options;

  const rawBaseQuery = fetchBaseQuery({
    ...rest,
    prepareHeaders: async (headers, api) => {
      // Preserve any caller-supplied header logic first.
      if (typeof userPrepareHeaders === "function") {
        await userPrepareHeaders(headers, api);
      }
      // Attach the session id so the BFF knows which key to encrypt with.
      try {
        await ensureSession();
        const sid = getSessionId();
        if (sid) headers.set("x-bff-sid", sid);
      } catch {
        // Fail open: without a session the BFF returns plaintext and the app
        // keeps working (handshake will be retried on the next request).
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const result = await rawBaseQuery(args, api, extraOptions);

    if (result?.data && isEncryptedEnvelope(result.data)) {
      try {
        result.data = await decryptEnvelope(result.data);
      } catch (err) {
        return {
          error: { status: "DECRYPTION_ERROR", error: String(err?.message || err) },
        };
      }
    }

    // Error bodies are JSON too, so the BFF encrypts them — decrypt so the
    // existing error handlers see the real { message, error, ... }.
    if (result?.error && isEncryptedEnvelope(result.error.data)) {
      try {
        result.error = { ...result.error, data: await decryptEnvelope(result.error.data) };
      } catch {
        /* leave as-is if it can't be decrypted */
      }
    }

    return result;
  };
}
