import { useCallback, useEffect, useState } from "react";
import {
  clearAnalyticsLog,
  downloadAnalyticsLog,
  formatAnalyticsLog,
  getAnalyticsLogEntries,
  getTagIds,
  isAnalyticsLogEnabled,
} from "../../utils/analyticsLog";

/**
 * On-screen viewer for the GTM / analytics event log.
 *
 * `trackEvent` no longer prints anything to the console, so this is where the
 * recorded events are read and written out as a file. Collapsed to a small pill
 * by default so it is not in the way while developing.
 *
 * Each row expands to the full property bag that was sent — tap one, or use
 * "Show data" to open them all.
 *
 * Visible only when recording is on — dev builds, or any build visited once with
 * `?gtmlog=1`. `?gtmlog=0` turns it off. Real users never see it.
 *
 * Styled inline on purpose: a debug affordance, not product UI, so it stays out
 * of the stylesheets and can be deleted in one file.
 */

const s = {
  pill: {
    position: "fixed",
    bottom: 16,
    left: 16,
    zIndex: 999999,
    padding: "7px 12px",
    borderRadius: 20,
    border: "1px solid #d1d5db",
    background: "rgba(17,24,39,0.88)",
    color: "#fff",
    font: "600 11px/1 system-ui, sans-serif",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
  },
  wrap: {
    position: "fixed",
    bottom: 16,
    left: 16,
    zIndex: 999999,
    width: 380,
    maxWidth: "calc(100vw - 32px)",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fffdf8",
    fontSize: 11,
    lineHeight: 1.45,
    overflow: "hidden",
    boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    font: "600 11px/1.3 system-ui, sans-serif",
    color: "#374151",
  },
  close: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1,
    padding: 2,
  },
  sinks: { padding: "6px 10px", color: "#6b7280", borderBottom: "1px solid #f0eee9" },
  bad: { color: "#b91c1c", fontWeight: 700 },
  good: { color: "#047857", fontWeight: 700 },
  btnRow: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px" },
  btn: {
    flex: "1 1 auto",
    minWidth: 84,
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    font: "600 11px/1 system-ui, sans-serif",
    cursor: "pointer",
  },
  primary: { background: "#111827", color: "#fff", borderColor: "#111827" },
  list: {
    maxHeight: 300,
    overflowY: "auto",
    overscrollBehaviorY: "contain",
    margin: 0,
    padding: "6px 10px 10px",
    listStyle: "none",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 10,
  },
  row: { padding: "3px 0", borderBottom: "1px dotted #eee", wordBreak: "break-word" },
  // Reset the UA button chrome — the row looks like text but has to be a button
  // so it is keyboard reachable.
  rowBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    border: "none",
    background: "transparent",
    padding: 0,
    font: "inherit",
    color: "inherit",
    cursor: "pointer",
  },
  caret: { display: "inline-block", width: 9, color: "#9ca3af" },
  props: {
    margin: "3px 0 5px 9px",
    padding: "6px 8px",
    background: "#f9fafb",
    border: "1px solid #eef0f2",
    borderRadius: 5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    fontSize: 9.5,
    lineHeight: 1.5,
    color: "#374151",
    maxHeight: 200,
    overflowY: "auto",
    overscrollBehaviorY: "contain",
  },
  meta: { color: "#9ca3af" },
  empty: { padding: "12px 10px", color: "#9ca3af" },
};

/** Stable per-entry key — timestamps can repeat when events fire in one tick. */
const rowKey = (e, i) => `${e.t}|${e.event}|${i}`;

const AnalyticsLogPanel = () => {
  // Read once: the flag can't change without a reload.
  const [visible] = useState(isAnalyticsLogEnabled);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  /** Which rows have their properties expanded. */
  const [expanded, setExpanded] = useState(() => new Set());
  /** Expand every row's data at once. */
  const [expandAll, setExpandAll] = useState(false);

  const refresh = useCallback(() => setEntries(getAnalyticsLogEntries()), []);

  const toggleRow = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Poll while open rather than wiring an event bus through trackEvent — this is
  // a debug panel and 1s is plenty to watch events land.
  useEffect(() => {
    if (!visible || !open) return undefined;
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [visible, open, refresh]);

  if (!visible) return null;

  if (!open) {
    return (
      <button type="button" style={s.pill} onClick={() => setOpen(true)}>
        GTM log
      </button>
    );
  }

  const hasDataLayer = Array.isArray(window.dataLayer);
  const hasGtag = typeof window.gtag === "function";
  // Read on render, not memoised: the container initialises asynchronously, so
  // this goes from "none detected" to the real ids a moment after load.
  const tagIds = getTagIds();
  const dropped = entries.filter((e) => e.sent === "none").length;
  // Newest first — the last thing you did is what you are looking for.
  const recent = entries.slice(-60).reverse();

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <span>
          GTM event log — {entries.length}
          {dropped > 0 ? ` (${dropped} not sent)` : ""}
        </span>
        <button
          type="button"
          style={s.close}
          onClick={() => setOpen(false)}
          aria-label="Close analytics log"
        >
          ✕
        </button>
      </div>

      <div style={s.sinks}>
        <div>
          dataLayer:{" "}
          <span style={hasDataLayer ? s.good : s.bad}>
            {hasDataLayer ? `present (${window.dataLayer.length})` : "MISSING"}
          </span>
          {"  ·  gtag: "}
          <span style={hasGtag ? s.good : s.bad}>{hasGtag ? "present" : "MISSING"}</span>
        </div>
        <div style={{ marginTop: 3 }}>
          GTM:{" "}
          <span style={tagIds.gtm.length ? s.good : s.bad}>
            {tagIds.gtm.join(", ") || "none detected"}
          </span>
          {"  ·  GA4: "}
          <span style={tagIds.ga.length ? s.good : s.bad}>
            {tagIds.ga.join(", ") || "none detected"}
          </span>
        </div>
      </div>

      <div style={s.btnRow}>
        <button
          type="button"
          style={{ ...s.btn, ...s.primary }}
          onClick={() => downloadAnalyticsLog()}
        >
          Download .txt
        </button>
        <button
          type="button"
          style={s.btn}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(formatAnalyticsLog());
            } catch {
              /* clipboard blocked — the download button still works */
            }
          }}
        >
          Copy
        </button>
        <button
          type="button"
          style={s.btn}
          onClick={() => {
            clearAnalyticsLog();
            setExpanded(new Set());
            refresh();
          }}
        >
          Clear
        </button>
        <button
          type="button"
          style={s.btn}
          onClick={() => {
            setExpandAll((v) => !v);
            // Clearing per-row state keeps the two controls from fighting: after
            // "collapse all", a row previously opened by hand stays closed.
            setExpanded(new Set());
          }}
        >
          {expandAll ? "Hide data" : "Show data"}
        </button>
      </div>

      {recent.length === 0 ? (
        <p style={s.empty}>No events recorded yet. Interact with the app.</p>
      ) : (
        <ul style={s.list}>
          {recent.map((e, i) => {
            const key = rowKey(e, i);
            const isOpen = expandAll || expanded.has(key);
            return (
              <li key={key} style={s.row}>
                <button
                  type="button"
                  style={s.rowBtn}
                  onClick={() => toggleRow(key)}
                  aria-expanded={isOpen}
                >
                  <span style={s.caret}>{isOpen ? "▾" : "▸"}</span>
                  <span style={s.meta}>{e.t.slice(11, 19)}</span>{" "}
                  <span style={e.sent === "none" ? s.bad : undefined}>{e.event}</span>
                  {e.sent !== "both" ? (
                    <span style={{ color: "#b45309" }}> [{e.sent}]</span>
                  ) : null}
                </button>

                {isOpen && (
                  <pre style={s.props}>
                    {[
                      `sent : ${e.sent}`,
                      `tags : ${e.tags || "-"}`,
                      `path : ${e.path}`,
                      JSON.stringify(e.props, null, 2),
                    ].join("\n")}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AnalyticsLogPanel;
