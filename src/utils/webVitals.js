/**
 * =========================================================
 * FIELD CORE WEB VITALS -> GA4
 * =========================================================
 *
 * Reports LCP, INP and CLS from real sessions, with attribution: not just the
 * number, but which element caused it and which phase of it was slow.
 *
 * Why this exists rather than more local measurement:
 *
 * Every attempt to measure INP from tooling in this project produced numbers
 * that turned out to be artefacts. The last one is worth recording so it is not
 * repeated: a headless/hidden browser tab is throttled by the browser to roughly
 * one animation frame per second. INP is measured to the next *presented* frame,
 * so an interaction whose DOM work finished in 19ms still reported 480ms, and
 * the same click re-measured reported 1664ms -- the figure tracked the frame gap
 * (108ms vs 893ms), not any work the app did. Repeated measurements of a single
 * unchanged interaction ranged over more than a second.
 *
 * Clarity reports INP 504ms on the horoscope routes from real users. That is the
 * only trustworthy signal we have, and it carries no attribution, so it says
 * something is slow without saying what. This closes that gap with field data
 * from real devices, where the frame clock is real.
 *
 * WHAT ARRIVES IN GA4
 * -------------------
 * One `web_vitals` event per metric per page view, with:
 *
 *   metric_name         "LCP" | "INP" | "CLS"
 *   metric_value        milliseconds, or CLS score x1000 (GA4 params are
 *                       integers; CLS 0.083 arrives as 83)
 *   metric_rating       "good" | "needs-improvement" | "poor"
 *   metric_id           unique per page view, so multiple events can be joined
 *   metric_target       CSS selector of the element responsible
 *   metric_page         pathname WITHOUT ids, so /astrologer/anjali and
 *                       /astrologer/hemant aggregate together
 *   metric_nav_type     navigate | reload | back-forward | prerender
 *
 * and, for INP specifically, the phase split that tells you what to fix:
 *
 *   inp_input_delay     waiting for the main thread before the handler runs
 *   inp_processing      the handler itself
 *   inp_presentation    handler finished -> next frame on screen
 *   inp_event_type      pointer | keyboard
 *   inp_load_state      whether the page was still loading when it happened
 *
 * Read the phase split first. Input delay means something else was occupying the
 * main thread; processing means our handler is genuinely slow; presentation
 * means the render or paint that follows is heavy. They point at completely
 * different fixes, and guessing wrong is how the previous attempt ended up
 * shipping a no-op.
 *
 * SETUP REQUIRED IN GA4 (this file cannot do it)
 * ----------------------------------------------
 * Custom dimensions/metrics have to be registered or the parameters are dropped
 * from reports -- they will still show in DebugView, which makes this easy to
 * miss. Admin -> Custom definitions -> Create, event-scoped, for each of:
 * metric_name, metric_rating, metric_target, metric_page, metric_nav_type,
 * inp_event_type, inp_load_state (dimensions) and metric_value,
 * inp_input_delay, inp_processing, inp_presentation (metrics).
 *
 * =========================================================
 */

import { trackEvent } from "./analytics";

const IS_DEV = import.meta.env.DEV;

/*
  Collapse ids out of the path.

  Without this, /astrologer/anjali, /astrologer/hemant and every room UUID are
  separate rows, and the one page with a real problem is split into a hundred
  samples too small to see. Clarity's own export has exactly this shape -- a live
  room URL with its full UUID sitting in the middle of the ranking.

  Zodiac signs are deliberately NOT collapsed: /daily-horoscope/scorpio and
  /yearly-horoscope/scorpio are the routes under investigation and the sign is
  part of what we are comparing.
*/
const normalisePath = (pathname) =>
  pathname
    .replace(/\/room-[0-9a-f-]{8,}/gi, "/room-:id")
    .replace(/\/\d+(?=\/|$)/g, "/:id")
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}(?=\/|$)/gi, "/:uuid")
    .slice(0, 100) || "/";

/*
  GA4 drops a string parameter over 100 characters rather than truncating it, so
  a long selector would silently cost us the one field that says WHICH element
  was slow. Truncate here instead, keeping the tail: the right-hand end of a CSS
  selector is the specific element, the left-hand end is ancestors we can infer.
*/
const clampSelector = (value) => {
  if (typeof value !== "string" || value === "") return "(unknown)";
  return value.length <= 100 ? value : `…${value.slice(-99)}`;
};

const round = (n) => (typeof n === "number" && isFinite(n) ? Math.round(n) : 0);

const send = (metric, extra = {}) => {
  const { name, rating, id, delta, value, navigationType } = metric;

  trackEvent("web_vitals", {
    metric_name: name,
    /*
      CLS is a unitless score around 0-1 and GA4 rounds parameters to integers,
      so sending it raw records every CLS as 0. x1000 keeps three decimals of
      precision -- divide by 1000 when reading CLS rows in GA4.
    */
    metric_value: name === "CLS" ? round(value * 1000) : round(value),
    metric_delta: name === "CLS" ? round(delta * 1000) : round(delta),
    metric_rating: rating,
    metric_id: id,
    metric_page: normalisePath(window.location.pathname),
    metric_nav_type: navigationType || "unknown",
    /*
      web-vitals finalises INP and CLS at page hide, so these events are emitted
      during visibilitychange/pagehide -- exactly when a normal XHR gets killed
      by the navigation. gtag honours this flag by sending via
      navigator.sendBeacon instead, which the browser completes after the page
      is gone. Without it the slowest sessions, which are the ones that leave
      abruptly, are the ones that never report.

      This only covers the gtag sink. The GTM dataLayer copy is subject to
      whatever transport the container's own GA4 tag is configured with, so
      treat gtag as the reliable one for these events.
    */
    transport_type: "beacon",
    ...extra,
  });

  if (IS_DEV) {
    console.log(`[WebVitals] ${name} ${round(value)} (${rating})`, extra);
  }
};

const onINPReport = (metric) => {
  const a = metric.attribution || {};
  send(metric, {
    metric_target: clampSelector(a.interactionTarget),
    inp_event_type: a.interactionType || "unknown",
    inp_input_delay: round(a.inputDelay),
    inp_processing: round(a.processingDuration),
    inp_presentation: round(a.presentationDelay),
    inp_load_state: a.loadState || "unknown",
  });
};

const onLCPReport = (metric) => {
  const a = metric.attribution || {};
  send(metric, {
    metric_target: clampSelector(a.element),
    lcp_ttfb: round(a.timeToFirstByte),
    lcp_load_delay: round(a.resourceLoadDelay),
    lcp_load_time: round(a.resourceLoadDuration),
    lcp_render_delay: round(a.elementRenderDelay),
  });
};

const onCLSReport = (metric) => {
  const a = metric.attribution || {};
  send(metric, {
    metric_target: clampSelector(a.largestShiftTarget),
    cls_load_state: a.loadState || "unknown",
  });
};

/**
 * Start reporting. Safe to call more than once; only the first call registers.
 */
let started = false;

export const initWebVitals = () => {
  if (started || typeof window === "undefined") return;
  started = true;

  /*
    Loaded from a dynamic import so the attribution build -- which is the larger
    one, because it carries the logic that maps a metric back to an element --
    lands in its own chunk instead of the entry bundle. Measuring performance
    must not be the thing that costs it.

    Deferred to idle after `load` for the same reason. This is safe for the
    metrics themselves: web-vitals registers its PerformanceObservers with
    `buffered: true`, so entries the browser recorded before this code ran are
    still delivered. A late start cannot miss an LCP that already happened.
  */
  const start = () => {
    import("web-vitals/attribution")
      .then(({ onLCP, onINP, onCLS }) => {
        onLCP(onLCPReport);
        onINP(onINPReport);
        onCLS(onCLSReport);
      })
      .catch((err) => {
        // Never let instrumentation break the page it is measuring.
        if (IS_DEV) console.warn("[WebVitals] failed to load:", err);
      });
  };

  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      setTimeout(start, 1500);
    }
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
};
