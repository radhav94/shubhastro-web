/*
 * Route links inside CMS-authored HTML through React Router.
 *
 * Bodies rendered with `dangerouslySetInnerHTML` are invisible to the router, so
 * every internal anchor in them is a full document load: the SPA tears down and
 * re-boots, re-downloading the entry bundle and re-running every startup request
 * before the destination paints. For seconds the page looks like it ignored the
 * click, which is exactly when someone clicks again. It also inflates page counts
 * — one session showed 95 page views from 80 clicks, looping between Kundli,
 * Daily Horoscope and Astrologers.
 *
 * The cost is worst on the static/legal pages, which the native app opens in a
 * webview with `?type=webview`: a Clarity session on /terms-and-conditions took
 * nearly six seconds just to reach first interaction, and any in-body link would
 * have charged the visitor that again.
 *
 * Delegated from the container rather than bound per anchor, because the body is
 * replaced wholesale whenever the content changes.
 *
 * Everything that should stay a browser navigation is left alone: modified and
 * non-primary clicks, new-tab links, downloads, other origins, and non-http
 * schemes such as mailto: and tel: (URL gives those an origin of "null", so the
 * origin check covers them).
 *
 * @param {(to: string) => void} navigate react-router's navigate
 * @returns {(e: MouseEvent) => void} onClick handler for the body container
 */
export const createCmsBodyClickHandler = (navigate) => (e) => {
  if (e.defaultPrevented) return;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

  const anchor = e.target?.closest?.("a[href]");
  if (!anchor) return;
  if (anchor.target && anchor.target !== "_self") return;
  if (anchor.hasAttribute("download")) return;

  let url;
  try {
    url = new URL(anchor.href, window.location.origin);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) return;

  /*
    Anchors that resolve to the page we are already on.

    Checking only for a hash would leave two cases falling through to
    `navigate(<the page we are already reading>)` — a no-op that renders nothing
    new, i.e. a dead click:

      <a href="#">   url.hash is "" for a bare "#".
      <a href="">    resolves to the current URL.

    Both are routine in CMS-authored bodies, and the stylesheets colour every
    anchor, so a placeholder link is indistinguishable from a real one.

    A hash whose target does not exist is dead natively too, and is treated the
    same way: a broken in-page link is a content problem we cannot fix from here,
    and returning to the top of the page is the least surprising thing left.
  */
  const isSamePage =
    url.pathname === window.location.pathname && url.search === window.location.search;

  if (isSamePage) {
    const targetId = url.hash ? decodeURIComponent(url.hash.slice(1)) : "";
    if (targetId) {
      const target =
        document.getElementById(targetId) || document.getElementsByName(targetId)[0];
      // Real in-page anchor with something to jump to — let the browser do it.
      if (target) return;
    }
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  e.preventDefault();
  navigate(url.pathname + url.search + url.hash);
};
