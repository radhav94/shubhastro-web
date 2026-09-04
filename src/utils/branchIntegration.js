/**
 * =========================================================
 * BRANCH.IO INTEGRATION UTILITY
 * =========================================================
 *
 * Handles initialization and integration with Branch.io SDK.
 * Works alongside branchEvents.js for comprehensive tracking.
 *
 * =========================================================
 */

const IS_DEV = import.meta.env.DEV;

/**
 * Check if Branch SDK is available
 */
export const isBranchAvailable = () => {
  return typeof window !== "undefined" && window.branch !== undefined;
};

/**
 * Initialize Branch.io SDK
 * Called after Branch script loads in index.html
 */
export const initializeBranch = () => {
  try {
    if (!isBranchAvailable()) {
      if (IS_DEV) console.warn("[Branch] SDK not loaded yet");
      return false;
    }

    // Branch is initialized in index.html with VITE_BRANCH_KEY from .env-cmdrc
    // This happens automatically when the page loads
    if (IS_DEV) {
      console.log("[Branch] ✓ Branch SDK initialized");
      console.log("[Branch] Branch Key Used:", import.meta.env.VITE_BRANCH_KEY ? "✓ Set" : "⚠️ Not configured");
    }
    
    // Set user identity if logged in
    const userId = localStorage.getItem("shubhtalk_customer_id");
    if (userId) {
      setBranchUser(userId);
    }
    
    return true;
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Initialization failed:", error);
    return false;
  }
};

/**
 * Set Branch user identity
 */
export const setBranchUser = (userId) => {
  try {
    if (!isBranchAvailable()) return;
    
    if (userId) {
      window.branch.setIdentity(userId);
      if (IS_DEV) console.log("[Branch] User identity set:", userId);
    }
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to set user identity:", error);
  }
};

/**
 * Clear Branch user identity (on logout)
 */
export const clearBranchUser = () => {
  try {
    if (!isBranchAvailable()) return;
    window.branch.logout();
    if (IS_DEV) console.log("[Branch] User logged out");
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to logout:", error);
  }
};

/**
 * Track Branch event via common reusable function
 * Uses window.trackBranchEvent for centralized event handling
 */
export const trackBranchEvent = (eventName, properties = {}) => {
  try {
    if (typeof window !== "undefined" && typeof window.trackBranchEvent === "function") {
      window.trackBranchEvent(eventName, properties);
    } else if (IS_DEV) {
      console.warn("[Branch] window.trackBranchEvent not available for event:", eventName);
    }
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to call window.trackBranchEvent:", error);
  }
};

/**
 * Manually flush Branch events
 * Ensures all queued events are sent immediately
 */
export const flushBranchEvents = () => {
  try {
    if (!isBranchAvailable()) {
      if (IS_DEV) console.warn("[Branch] Cannot flush - SDK not available");
      return;
    }
    
    if (typeof window.branch.flush === "function") {
      window.branch.flush((err, data) => {
        if (err) {
          if (IS_DEV) console.error("[Branch] Flush error:", err);
        } else {
          if (IS_DEV) console.log("[Branch] ✓ Events flushed successfully");
        }
      });
    } else {
      if (IS_DEV) console.warn("[Branch] flush() method not available");
    }
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to flush events:", error);
  }
};

/**
 * Track commerce event
 */
export const trackBranchCommerceEvent = (eventName, properties = {}) => {
  try {
    if (!isBranchAvailable()) return;
    
    if (IS_DEV) {
      console.log("[Branch] Commerce event tracked:", eventName, properties);
    }
    
    window.branch.trackCommerceEvent(eventName, properties);
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to track commerce event:", error);
  }
};

/**
 * Get Branch data
 */
export const getBranchData = () => {
  try {
    if (!isBranchAvailable()) return null;
    
    return window.branch.data.get();
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to get data:", error);
    return null;
  }
};

/**
 * Create referral link
 */
export const createBranchLink = (properties = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isBranchAvailable()) {
        reject(new Error("Branch SDK not available"));
        return;
      }
      
      window.branch.link.create(properties, (err, link) => {
        if (err) {
          if (IS_DEV) console.error("[Branch] Failed to create link:", err);
          reject(err);
        } else {
          if (IS_DEV) console.log("[Branch] Link created:", link);
          resolve(link);
        }
      });
    } catch (error) {
      if (IS_DEV) console.error("[Branch] Link creation exception:", error);
      reject(error);
    }
  });
};

/**
 * Share link with SMS
 */
export const sendBranchSMS = (phone, linkData = {}) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isBranchAvailable()) {
        reject(new Error("Branch SDK not available"));
        return;
      }
      
      window.branch.sendSMS(phone, linkData, (err) => {
        if (err) {
          if (IS_DEV) console.error("[Branch] SMS send failed:", err);
          reject(err);
        } else {
          if (IS_DEV) console.log("[Branch] SMS sent successfully");
          resolve();
        }
      });
    } catch (error) {
      if (IS_DEV) console.error("[Branch] SMS send exception:", error);
      reject(error);
    }
  });
};

/**
 * Add Branch listener for deep links
 */
export const addBranchDeepLinkListener = (callback) => {
  try {
    if (!isBranchAvailable()) return;
    
    window.branch.addListener("willShowJourney", (data) => {
      if (IS_DEV) console.log("[Branch] Deep link detected:", data);
      callback(data);
    });
  } catch (error) {
    if (IS_DEV) console.error("[Branch] Failed to add listener:", error);
  }
};

// Expose trackBranchEvent globally for use across the app
if (typeof window !== "undefined") {
  window.trackBranchEvent = function(eventName, eventData) {
    console.log("📤 Branch event called:", eventName, eventData);

    if (typeof window.branch === "undefined") {
      console.warn("⚠️ Branch SDK not available:", eventName);
      return;
    }

    window.branch.logEvent(
      eventName,
      eventData || {},
      function(err) {
        if (err) {
          console.error("❌ Branch event failed:", eventName, err);
        } else {
          console.log("✅ Branch event sent:", eventName);
        }
      }
    );
  };
}

export default {
  isBranchAvailable,
  initializeBranch,
  setBranchUser,
  clearBranchUser,
  trackBranchEvent,
  trackBranchCommerceEvent,
  getBranchData,
  createBranchLink,
  sendBranchSMS,
  addBranchDeepLinkListener,
};
