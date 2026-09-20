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

/*
  Why the store buttons cannot rely on `target="_blank"` inside an in-app browser.

  A play.google.com link is not an ordinary navigation: Android resolves it to the
  Play Store app via an intent handoff. Instagram's and Facebook's in-app WebViews
  routinely refuse that handoff, and because the anchor is `target="_blank"` there
  is no tab for the fallback web page to land in either — so the tap produces
  nothing at all. Ordinary web links in the same WebView are unaffected, which is
  why this fails while the footer's outbound brand links work.

  Clarity session 1d5d1ka is exactly this: an Instagram Reels visitor tapped Google
  Play at 01:06, nothing happened, tapped again at 01:14, and then went on to open
  three ordinary outbound links successfully at 02:30-02:44. The onClick analytics
  fired on both taps, so the click was registered while no navigation occurred.

  Note this is a DIFFERENT cause from the App Store rage clicks recorded above:
  that one was a 404 URL, this one is a blocked handoff. Repointing the URL cannot
  fix it.

  Mitigation used by the consumers: when isInAppBrowser() is true, navigate the
  CURRENT tab instead of opening a new one. Same-tab navigation to play.google.com
  renders the Play Store web listing inside the WebView, which then offers its own
  "open in app" affordance — a real destination instead of silence. The consumers
  also surface this line so a tap that still goes nowhere is explained rather than
  dead.
*/
export const IN_APP_BROWSER_STORE_HINT =
  "This app's built-in browser can block the Play Store from opening. If nothing happens, tap the \u22ef menu and choose \"Open in Chrome\".";

export const isAppStoreLive = () => Boolean(APP_STORE_URL);
