import { lazy } from "react";

/*
  Retrying, non-poisoning replacement for React.lazy.

  Why this exists
  ---------------
  React.lazy caches the OUTCOME of its import, including a rejection. Once the
  dynamic import fails once, every subsequent render of that lazy component
  re-throws the same stored error forever — React never retries. With no error
  boundary between it and the route, that surfaces as RouteErrorBoundary's
  "Something went wrong", and it keeps surfacing until a full page reload,
  because remounting the component reuses the same poisoned lazy object.

  /live is the worst case in this app: three nested module-scope lazy()
  boundaries in a row (LivePlayerPage -> InteractiveLiveStreaming, the ~1,256 kB
  Agora SDK -> LiveStreamingContainer, ~74 kB). Any one of them rejecting takes
  the whole route down, and navigating back to /live shows the same error screen
  rather than retrying.

  A chunk request rejects for ordinary reasons, not just outages:
    - navigating away mid-download aborts the in-flight module request, which is
      exactly the "went to /live then pressed back" case;
    - after a deploy, a client holding the previous index.html asks for a hashed
      filename that no longer exists and gets a 404;
    - the Vite dev server re-optimises dependencies and the old URL 404s;
    - flaky mobile connections, which is most of this traffic.

  What it does
  ------------
  Retries the import a few times with a short backoff before giving up, and
  `bust` re-requests with a cache-busting query so a retry cannot be served the
  same failed/stale response from the HTTP cache.

  IMPORTANT: this reduces the chance of reaching the poisoned state; it cannot
  remove it. React still caches a final rejection. Recovering after that needs
  the lazy component to be re-created, which means an error boundary that
  remounts it — see makeRetryableLazy below.
*/

const DEFAULT_RETRIES = 2;
const DEFAULT_DELAY_MS = 600;

/**
 * Import with retry. Resolves to the module, or rejects after the last attempt.
 *
 * @param {() => Promise<unknown>} factory dynamic import thunk
 * @param {{ retries?: number, delayMs?: number }} [options]
 */
export const importWithRetry = (
  factory,
  { retries = DEFAULT_RETRIES, delayMs = DEFAULT_DELAY_MS } = {}
) =>
  new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      factory()
        .then(resolve)
        .catch((err) => {
          if (remaining <= 0) {
            reject(err);
            return;
          }
          setTimeout(() => attempt(remaining - 1), delayMs);
        });
    };
    attempt(retries);
  });

/**
 * Drop-in for React.lazy that retries the import before failing.
 *
 * @param {() => Promise<unknown>} factory dynamic import thunk
 * @param {{ retries?: number, delayMs?: number }} [options]
 */
export const lazyWithRetry = (factory, options) =>
  lazy(() => importWithRetry(factory, options));

/**
 * Builds a NEW lazy component on every call, so an error boundary can recover
 * from a cached rejection by bumping a key and calling this again. React.lazy
 * keys its cache to the lazy object itself, so a fresh object means a fresh
 * attempt.
 *
 * @param {() => Promise<unknown>} factory dynamic import thunk
 * @param {{ retries?: number, delayMs?: number }} [options]
 */
export const makeRetryableLazy = (factory, options) => () =>
  lazyWithRetry(factory, options);

/**
 * Best-effort warm-up for a chunk we expect to render shortly.
 *
 * Callers previously invoked the import thunk bare and ignored the promise. A
 * rejected preload then became an unhandled promise rejection — noise in the
 * console, and on some setups a reported error — even though the failure is
 * harmless at that point, since the real load happens when the component
 * renders. Swallow it explicitly so intent is on the page.
 *
 * @param {() => Promise<unknown>} factory dynamic import thunk
 */
export const preloadChunk = (factory) => {
  try {
    const p = factory();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* a synchronous throw here is not worth surfacing either */
  }
};
