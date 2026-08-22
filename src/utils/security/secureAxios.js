/**
 * Secure transport for axios instances.
 *
 * Attaches:
 *   - a request interceptor that establishes the ECDH session and adds the
 *     `x-sgw-sid` header, and
 *   - a response interceptor (success + error) that decrypts secure gateway envelopes back
 *     into the plain JSON existing callers/error handlers expect.
 *
 * Call attachSecureTransport(instance) BEFORE registering the instance's own
 * response error handler so decryption runs first in the response chain.
 *
 * Decryption is envelope-shape gated, so non-secure gateway / binary responses are
 * untouched.
 */

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

export function attachSecureTransport(instance) {
  instance.interceptors.request.use(async (config) => {
    try {
      await ensureSession();
      const sid = getSessionId();
      if (sid) {
        config.headers = config.headers || {};
        config.headers["x-sgw-sid"] = sid;
      }
    } catch {
      // Handshake failed (e.g. Web Crypto unavailable). The gateway is
      // fail-closed and will answer 428; surfaced to the caller below.
    }

    /*
     * TEMPORARY: same CloudFront workaround as secureBaseQuery — see
     * sgwCacheBuster.js. Kept on the axios path too so it isn't a partial fix:
     * privateRequest/publicRequest go through the same /sgw origin and are
     * equally exposed to a cached envelope from another session.
     */
    if (SGW_CACHE_BUSTER_ENABLED && isCacheBustableMethod(config.method)) {
      config.params = {
        ...(config.params || {}),
        [SGW_CACHE_BUSTER_PARAM]: sgwCacheBusterValue(),
      };
    }

    return config;
  });

  instance.interceptors.response.use(
    async (response) => {
      if (response && isEncryptedEnvelope(response.data)) {
        try {
          response.data = await decryptEnvelope(response.data);
        } catch {
          /* leave encrypted payload if decryption fails */
        }
      }
      return response;
    },
    async (error) => {
      const config = error?.config;

      // Fail-closed recovery: gateway 428 (session missing/expired). Drop the
      // session, re-handshake, and replay the original request once.
      if (error?.response?.status === 428 && config && !config.__sgwRetried) {
        config.__sgwRetried = true;
        resetSession();
        try {
          await ensureSession();
        } catch {
          /* if it still can't handshake, fall through and reject below */
        }
        return instance(config);
      }

      if (error?.response && isEncryptedEnvelope(error.response.data)) {
        try {
          error.response.data = await decryptEnvelope(error.response.data);
        } catch {
          /* leave as-is */
        }
      }
      return Promise.reject(error);
    }
  );
}
