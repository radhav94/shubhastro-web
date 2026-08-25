/**
 * Secure base query for RTK Query.
 *
 * Wraps fetchBaseQuery so that, transparently to every endpoint:
 *   - the ECDH session is established and the `x-sgw-sid` header is attached,
 *   - encrypted response envelopes from the secure gateway are decrypted back into the
 *     plain JSON the endpoints/transformResponse already expect.
 *
 * Decryption is envelope-shape gated: responses that are not secure gateway envelopes
 * (e.g. third-party hosts hit directly, or binary) pass through unchanged, so
 * this is safe to use on every base API including ones that bypass the secure gateway.
 */

import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  ensureSession,
  getSessionId,
  resetSession,
  isEncryptedEnvelope,
  decryptEnvelope,
} from "./cryptoClient";
import {
  SGW_CACHE_BUSTER_ENABLED,
  SGW_CACHE_BUSTER_PARAM,
  isCacheBustableMethod,
  sgwCacheBusterValue,
} from "./sgwCacheBuster";

/**
 * TEMPORARY: adds a unique query parameter to gateway GETs so CloudFront cannot
 * serve one cached body for two different query strings. See sgwCacheBuster.js
 * for the measurements and for the CloudFront change that makes this removable.
 *
 * Applied here, inside baseQuery, rather than at the endpoints: RTK Query's own
 * cache key is derived from the endpoint arguments, not from the URL built here.
 * So a cached RTK result is still served without a network call, and metered
 * upstreams (vedicApi's monthly quota) keep their request savings.
 */
const withCacheBuster = (args) => {
  if (!SGW_CACHE_BUSTER_ENABLED) return args;

  if (typeof args === "string") {
    return { url: args, params: { [SGW_CACHE_BUSTER_PARAM]: sgwCacheBusterValue() } };
  }
  if (!args || typeof args !== "object") return args;
  if (!isCacheBustableMethod(args.method)) return args;

  return {
    ...args,
    params: { ...(args.params || {}), [SGW_CACHE_BUSTER_PARAM]: sgwCacheBusterValue() },
  };
};

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
      // Attach the session id so the secure gateway knows which key to encrypt with.
      try {
        await ensureSession();
        const sid = getSessionId();
        if (sid) headers.set("x-sgw-sid", sid);
      } catch {
        // Handshake failed (e.g. Web Crypto unavailable on an insecure origin).
        // The gateway is fail-closed and will answer 428; the request layer
        // below surfaces that to the caller rather than leaking plaintext.
      }
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    let result = await rawBaseQuery(withCacheBuster(args), api, extraOptions);

    // Fail-closed recovery: the gateway returns 428 when the session is missing
    // or expired. Drop the stale session and replay once — prepareHeaders will
    // re-handshake and attach a fresh sid. Bounded to a single retry.
    //
    // The replay gets a fresh cache-buster value, which is what we want: the 428
    // itself may have been served from cache, and reusing the same URL could hand
    // us the same cached rejection.
    if (result?.error?.status === 428) {
      resetSession();
      result = await rawBaseQuery(withCacheBuster(args), api, extraOptions);
    }

    if (result?.data && isEncryptedEnvelope(result.data)) {
      try {
        result.data = await decryptEnvelope(result.data);
      } catch (err) {
        return {
          error: { status: "DECRYPTION_ERROR", error: String(err?.message || err) },
        };
      }
    }

    // Error bodies are JSON too, so the secure gateway encrypts them — decrypt so the
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
