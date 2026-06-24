/**
 * Secure transport for axios instances.
 *
 * Attaches:
 *   - a request interceptor that establishes the ECDH session and adds the
 *     `x-bff-sid` header, and
 *   - a response interceptor (success + error) that decrypts BFF envelopes back
 *     into the plain JSON existing callers/error handlers expect.
 *
 * Call attachSecureTransport(instance) BEFORE registering the instance's own
 * response error handler so decryption runs first in the response chain.
 *
 * Decryption is envelope-shape gated, so non-BFF / binary responses are
 * untouched.
 */

import {
  ensureSession,
  getSessionId,
  isEncryptedEnvelope,
  decryptEnvelope,
} from "./cryptoClient";

export function attachSecureTransport(instance) {
  instance.interceptors.request.use(async (config) => {
    try {
      await ensureSession();
      const sid = getSessionId();
      if (sid) {
        config.headers = config.headers || {};
        config.headers["x-bff-sid"] = sid;
      }
    } catch {
      // Fail open — request proceeds, BFF returns plaintext.
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
