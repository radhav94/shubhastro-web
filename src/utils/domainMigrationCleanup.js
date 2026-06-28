/**
 * Domain Migration Cleanup Utility
 * 
 * Automatically cleans stale browser data (localStorage, sessionStorage,
 * cookies, service worker cache) when users visit the new domain for the
 * first time after migration.
 * 
 * Runs once per version upgrade — controlled by APP_STORAGE_VERSION.
 * Execute this BEFORE router initialization in main.jsx.
 */

const APP_STORAGE_VERSION = "v2";
const VERSION_KEY = "app_storage_version";
const REDIRECT_COUNT_KEY = "migration_redirect_count";
const MAX_REDIRECTS = 3;

// Correct (current) domains where this app should run
const VALID_DOMAINS = [
  "shubhastro.ai",
  "www.shubhastro.ai",
  "localhost",
];

// Old/stale domains that users may have cached data referencing
// If current domain is one of these, redirect to the correct domain
const OLD_DOMAINS = [
  "betaastrologer.shubhastro.ai",
  "astrologer.shubhastro.ai",
  "shubhtalk.epicon.in",
  "devapi-shubhtalk.epicon.in",
  "sta-shubhtalk.epicon.in",
];

// localStorage keys to remove (stale/old domain keys)
const STALE_LOCAL_STORAGE_KEYS = [
  "profile",
  "redirect_url",
  "tenant",
  "persist:root",
  "auth",
  "old_domain",
  "old_session",
  "shubhtalk_redirect_url",
  "shubhtalk_old_domain",
];

/**
 * Check if the user is currently on an old/stale domain.
 * If so, redirect them to the correct domain immediately.
 * Returns true if redirect was triggered.
 */
function checkAndRedirectFromOldDomain() {
  const currentHost = window.location.hostname;

  // If we're on an old domain, redirect to the correct one
  if (OLD_DOMAINS.includes(currentHost)) {
    console.log("[Migration] On old domain:", currentHost, "→ redirecting to shubhastro.ai");
    const newUrl = `https://shubhastro.ai${window.location.pathname}${window.location.search}`;
    window.location.replace(newUrl);
    return true;
  }

  return false;
}

/**
 * Check if cleanup is needed based on version mismatch or domain mismatch
 */
function shouldRunCleanup() {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion === APP_STORAGE_VERSION) return false;

    // Version mismatch — cleanup needed
    return true;
  } catch {
    // If localStorage is inaccessible, skip
    return false;
  }
}

/**
 * Check if stored domain differs from current (indicates migration)
 */
function hasDomainMismatch() {
  try {
    const storedDomain = localStorage.getItem("shubhtalk_domain");
    if (!storedDomain) return false;

    const currentDomain = window.location.hostname;
    return storedDomain !== currentDomain;
  } catch {
    return false;
  }
}

/**
 * Clear specific stale keys from localStorage
 * Also removes any keys/values referencing old domains
 */
function cleanLocalStorage() {
  try {
    STALE_LOCAL_STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    });

    // Remove any keys that reference old domains in key name OR value
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check key name
      if (OLD_DOMAINS.some((domain) => key.includes(domain))) {
        keysToRemove.push(key);
        continue;
      }

      // Check value for old domain URLs that could trigger redirects
      try {
        const value = localStorage.getItem(key);
        if (value && OLD_DOMAINS.some((domain) => value.includes(domain))) {
          keysToRemove.push(key);
        }
      } catch { /* skip unreadable values */ }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    console.log("[Migration] localStorage cleaned —", keysToRemove.length, "stale entries removed");
  } catch (e) {
    console.warn("[Migration] localStorage cleanup failed:", e.message);
  }
}

/**
 * Clear all sessionStorage
 */
function cleanSessionStorage() {
  try {
    sessionStorage.clear();
    console.log("[Migration] sessionStorage cleaned");
  } catch (e) {
    console.warn("[Migration] sessionStorage cleanup failed:", e.message);
  }
}

/**
 * Clear all cookies for current hostname and root domain
 */
function cleanCookies() {
  try {
    const cookies = document.cookie.split(";");
    if (cookies.length === 0 || (cookies.length === 1 && cookies[0].trim() === "")) {
      return;
    }

    const hostname = window.location.hostname;
    // Extract root domain (e.g., "shubhastro.ai" from "www.shubhastro.ai")
    const parts = hostname.split(".");
    const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : hostname;

    const paths = ["/", ""];
    const domains = [hostname, `.${hostname}`, rootDomain, `.${rootDomain}`, ""];

    cookies.forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      if (!cookieName) return;

      // Expire cookie across all path/domain combinations
      domains.forEach((domain) => {
        paths.forEach((path) => {
          let expireStr = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
          if (domain) {
            expireStr += `; domain=${domain}`;
          }
          document.cookie = expireStr;
        });
      });
    });

    console.log("[Migration] cookies removed");
  } catch (e) {
    console.warn("[Migration] cookie cleanup failed:", e.message);
  }
}

/**
 * Unregister all service workers and clear Cache Storage
 */
async function cleanServiceWorkers() {
  try {
    // Unregister service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // Clear Cache Storage
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    console.log("[Migration] cache cleared");
  } catch (e) {
    console.warn("[Migration] service worker/cache cleanup failed:", e.message);
  }
}

/**
 * Redirect loop protection
 * If the page keeps redirecting, break the loop after MAX_REDIRECTS
 */
function checkRedirectLoop() {
  try {
    const count = parseInt(sessionStorage.getItem(REDIRECT_COUNT_KEY) || "0", 10);

    if (count >= MAX_REDIRECTS) {
      console.warn("[Migration] redirect prevented — loop detected, going home");
      sessionStorage.removeItem(REDIRECT_COUNT_KEY);
      // Break the loop: go to homepage
      if (window.location.pathname !== "/") {
        window.location.replace("/");
        return true; // Signal that redirect was triggered
      }
    }

    // Increment count
    sessionStorage.setItem(REDIRECT_COUNT_KEY, String(count + 1));

    // Clear count after 5 seconds (if user stays, it's not a loop)
    setTimeout(() => {
      try {
        sessionStorage.removeItem(REDIRECT_COUNT_KEY);
      } catch { /* ignore */ }
    }, 5000);

    return false;
  } catch {
    return false;
  }
}

/**
 * Main migration cleanup function.
 * Call this synchronously before React renders.
 * Returns true if a redirect was triggered (app should not mount).
 */
export function runDomainMigrationCleanup() {
  // Step 1: If user is on an old domain, redirect immediately
  if (checkAndRedirectFromOldDomain()) {
    return true;
  }

  // Step 2: Check for redirect loops
  if (checkRedirectLoop()) {
    return true;
  }

  // Step 3: Check if cleanup is needed
  if (!shouldRunCleanup()) {
    return false;
  }

  const domainChanged = hasDomainMismatch();

  console.log("[Migration] Running cleanup — version upgrade detected", domainChanged ? "(domain changed)" : "");

  // Execute cleanup
  cleanLocalStorage();
  cleanSessionStorage();
  cleanCookies();

  // Service worker cleanup is async but fire-and-forget
  cleanServiceWorkers();

  // Store new version and current domain
  try {
    localStorage.setItem(VERSION_KEY, APP_STORAGE_VERSION);
    localStorage.setItem("shubhtalk_domain", window.location.hostname);
  } catch { /* ignore */ }

  console.log("[Migration] Cleanup complete");
  return false;
}

export default runDomainMigrationCleanup;
