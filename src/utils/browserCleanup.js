/**
 * Browser Cleanup Utility
 * 
 * Detects stale browser state from a previous domain migration
 * (betaastrologer.shubhastro.ai) and clears all stored data to prevent
 * redirect loops — especially on Safari.
 * 
 * Must execute BEFORE React router mounts.
 * 
 * Rollback: Remove the import of this file from main.jsx to disable.
 */

const STALE_DOMAINS = ['betaastrologer.shubhastro.ai', 'astrologer.shubhastro.ai'];
const CLEANUP_FLAG = 'shubhtalk_cleanup_done';

/**
 * Check if any localStorage value contains a stale domain reference.
 */
function hasStaleRedirectData() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      if (value && STALE_DOMAINS.some((domain) => value.includes(domain))) {
        return true;
      }
    }
  } catch {
    // Private browsing or storage access error
  }
  return false;
}

/**
 * Check if the stored role is ASTROLOGER (should never exist on customer app).
 */
function hasAstrologerRole() {
  try {
    return localStorage.getItem('shubhtalk_role') === 'ASTROLOGER';
  } catch {
    return false;
  }
}

/**
 * Clear all cookies for current hostname and parent domain.
 */
function clearAllCookies() {
  const cookies = document.cookie.split(';');
  const hostname = window.location.hostname;
  // Parent domain (e.g., .shubhastro.ai)
  const parts = hostname.split('.');
  const parentDomain = parts.length >= 2 ? '.' + parts.slice(-2).join('.') : '';

  cookies.forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (!name) return;
    // Clear for current path
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    // Clear for current hostname
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${hostname}`;
    // Clear for parent domain
    if (parentDomain) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${parentDomain}`;
    }
  });
  console.log('[Cleanup] cookies removed');
}

/**
 * Unregister all service workers and clear Cache Storage.
 */
async function clearServiceWorkersAndCache() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      console.log('[Cleanup] service workers removed');
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
      console.log('[Cleanup] cache storage removed');
    }
  } catch (err) {
    console.warn('[Cleanup] cache/sw cleanup error:', err);
  }
}

/**
 * Main cleanup function. Returns true if cleanup was performed and a reload is needed.
 */
export function runBrowserCleanup() {
  // Prevent infinite loop: if cleanup already done this session, stop
  try {
    if (sessionStorage.getItem(CLEANUP_FLAG)) {
      return false;
    }
  } catch {
    // sessionStorage not available
    return false;
  }

  const needsCleanup = hasStaleRedirectData() || hasAstrologerRole();

  if (!needsCleanup) {
    return false;
  }

  console.log('[Cleanup] started — stale domain data or ASTROLOGER role detected');

  // Clear localStorage
  try {
    localStorage.clear();
    console.log('[Cleanup] localStorage removed');
  } catch { /* ignore */ }

  // Clear sessionStorage (except our flag)
  try {
    sessionStorage.clear();
    console.log('[Cleanup] sessionStorage removed');
  } catch { /* ignore */ }

  // Set the flag AFTER clearing sessionStorage
  try {
    sessionStorage.setItem(CLEANUP_FLAG, '1');
  } catch { /* ignore */ }

  // Clear cookies
  clearAllCookies();

  // Clear service workers and cache (async, non-blocking for reload)
  clearServiceWorkersAndCache();

  // Safari-compatible reload: wait briefly then navigate to origin
  console.log('[Cleanup] safari reload triggered');
  setTimeout(() => {
    window.location.href = window.location.origin;
  }, 300);

  return true; // Signals that app should not continue mounting
}
