// Single source of truth for the mobile app store links.
//
// These were duplicated in Footer.jsx and MobileAppModal.jsx, and the iOS one
// was a scaffold placeholder that was never filled in:
//
//   https://apps.apple.com/app/shubhtalk/id123456789
//
// `id123456789` is the example ID from Apple's docs. That URL returns 404, and
// there is no published iOS build to point it at — a lookup by bundle ID
// (com.pittieglobal.shubhastro, taken from public/.well-known/apple-app-site-association)
// returns zero results, as does an App Store search for "shubhastro". So the
// button was guaranteed to fail for every visitor who tapped it, which is what
// the Instagram in-app-browser session recorded as rage clicks on the App Store
// button. The Android link is real and returns 200.

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.pittieglobal.shubhastro&pcampaignid=web_share";

/**
 * Set this to the real App Store URL once the iOS app is published, e.g.
 * `https://apps.apple.com/in/app/shubhastro/id0000000000`. Setting it is the
 * only change needed — both consumers gate on it.
 *
 * While it is null the two surfaces deliberately differ:
 *   - Footer: the App Store button is not rendered at all. The footer is
 *     permanent chrome on every page, so a standing "coming soon" placeholder
 *     is noise rather than information.
 *   - MobileAppModal: the button stays visible and explains on tap, because
 *     that modal exists specifically to pitch the app and dropping iOS from it
 *     would leave the pitch looking Android-only by accident.
 */
export const APP_STORE_URL = null;

export const IOS_UNAVAILABLE_MESSAGE =
  "The iOS app isn't out yet. It's available on Android today, and works right here in your browser meanwhile.";

export const isAppStoreLive = () => Boolean(APP_STORE_URL);
