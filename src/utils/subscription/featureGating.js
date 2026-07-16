// Central mapping of AI WOW feature slugs to backend featureKeys and access levels.
// Used to gate premium features on the frontend before opening them.

export const ACCESS_LEVEL = {
  FREE: "free",
  FREEMIUM: "freemium",
  PREMIUM: "premium",
};

// slug (as used in the suite grid and /ai-wow/:slug routes) -> { featureKey, accessLevel }
export const FEATURE_ACCESS_BY_SLUG = {
  "ai-palmistry-scanner": { featureKey: "palmistry_scanner", accessLevel: ACCESS_LEVEL.PREMIUM },
  "astro-face-reading": { featureKey: "face_analysis", accessLevel: ACCESS_LEVEL.PREMIUM },
  "signature-analysis": { featureKey: "signature_analysis", accessLevel: ACCESS_LEVEL.PREMIUM },
  "clothes-colour-analysis": { featureKey: "clothes_color_photo", accessLevel: ACCESS_LEVEL.PREMIUM },
  "gemstone-authenticity": { featureKey: "gemstone_scanner", accessLevel: ACCESS_LEVEL.PREMIUM },
  "aura-photography": { featureKey: "aura_photography", accessLevel: ACCESS_LEVEL.PREMIUM },
  "ar-vastu-scanner": { featureKey: "vastu_scanner", accessLevel: ACCESS_LEVEL.PREMIUM },
  "cosmic-chat": { featureKey: "cosmic_chat", accessLevel: ACCESS_LEVEL.FREEMIUM },
  "talk-to-your-kundli": { featureKey: "kundli_chat", accessLevel: ACCESS_LEVEL.FREEMIUM },
  "dream-interpreter": { featureKey: "dream_interpreter", accessLevel: ACCESS_LEVEL.FREEMIUM },
};

export const getFeatureAccess = (slug) =>
  FEATURE_ACCESS_BY_SLUG[slug] || { featureKey: null, accessLevel: ACCESS_LEVEL.FREE };

export const isPremiumFeature = (slug) =>
  getFeatureAccess(slug).accessLevel === ACCESS_LEVEL.PREMIUM;

// Known backend subscription/entitlement block reasons.
export const SUBSCRIPTION_REASON = {
  PREMIUM_REQUIRED: "PREMIUM_REQUIRED",
  EXTENDED_PLAN_REQUIRED: "EXTENDED_PLAN_REQUIRED",
  EXTENDED_PLAN_EXHAUSTED: "EXTENDED_PLAN_EXHAUSTED",
  INSUFFICIENT_WALLET_BALANCE: "INSUFFICIENT_WALLET_BALANCE",
};

const KNOWN_REASONS = new Set(Object.values(SUBSCRIPTION_REASON));

// Extract a known subscription reason from various error/response shapes
// (RTK Query error {status,data}, thrown errors, axios-like, or a raw body).
export const getSubscriptionErrorReason = (input) => {
  if (!input) return null;
  const bodies = [
    input,
    input.data,
    input.error,
    input.response?.data,
    input.data?.data,
    input.data?.error,
  ];
  for (const b of bodies) {
    if (!b || typeof b !== "object") continue;
    const cands = [b.reason, b.code, b.message, b.error?.code, b.data?.reason];
    for (const c of cands) {
      if (typeof c === "string" && KNOWN_REASONS.has(c)) return c;
    }
  }
  return null;
};
