import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  clearTruecallerLog,
  copyTruecallerLog,
  downloadTruecallerLog,
  getTruecallerLogEntries,
} from "../../../utils/truecaller/truecallerLog";

/**
 * On-screen viewer for the Truecaller diagnostic log.
 *
 * Rendered only when the log viewer flag is on (`?tclog=1` once, per
 * isTruecallerLogViewerEnabled) — never for real users. It exists because the
 * flow can only be exercised on a deployed build on a real Android phone, where
 * there is no console: the same trail that would go to devtools is kept in
 * localStorage and can be written out as a .txt from here.
 *
 * Styled inline on purpose. This is a debug affordance, not product UI, so it
 * stays out of Onboarding.module.scss and can be deleted in one file.
 */
const s = {
  wrap: {
    marginTop: 14,
    border: "1px solid #d1d5db",
    borderRadius: 10,
    background: "#fffdf8",
    fontSize: 11,
    lineHeight: 1.45,
    overflow: "hidden",
  },
  head: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    background: "#f3f4f6",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 600,
    color: "#374151",
  },
  btnRow: { display: "flex", flexWrap: "wrap", gap: 6, padding: "8px 10px" },
  btn: {
    flex: "1 1 auto",
    minWidth: 84,
    padding: "7px 10px",
    borderRadius: 6,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontSize: 11,
    fontWeight: 600,
  },
  list: {
    maxHeight: 190,
    overflowY: "auto",
    margin: 0,
    padding: "6px 10px 10px",
    listStyle: "none",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace",
    color: "#374151",
    wordBreak: "break-word",
  },
  row: { padding: "3px 0", borderBottom: "1px dotted #e5e7eb" },
  ev: { fontWeight: 700, color: "#1f2937" },
  bad: { fontWeight: 700, color: "#b91c1c" },
  good: { fontWeight: 700, color: "#15803d" },
  empty: { padding: "10px", color: "#6b7280" },
};

/** Events worth colouring so the failure point is findable at a glance. */
const FAILURE_EVENTS = new Set([
  "poll_error",
  "poll_timeout",
  "session_create_failed",
  "login_threw",
  "aborted_unsupported",
  "app_not_installed",
  "deeplink_threw",
  "log_download_failed",
]);
const SUCCESS_EVENTS = new Set(["login_complete", "session_create_ok"]);

const TruecallerLogPanel = ({ unsupportedReason, isSupported, status }) => {
  const [entries, setEntries] = useState(() => getTruecallerLogEntries());

  // The log is written from outside React (a plain module), so poll it while the
  // panel is open rather than wiring an event bus for a debug view.
  useEffect(() => {
    const id = setInterval(() => setEntries(getTruecallerLogEntries()), 1000);
    return () => clearInterval(id);
  }, []);

  const onDownload = useCallback(() => {
    const ok = downloadTruecallerLog();
    toast[ok ? "success" : "error"](
      ok ? "Log saved to Downloads" : "Could not save the log file",
    );
  }, []);

  const onCopy = useCallback(async () => {
    const ok = await copyTruecallerLog();
    toast[ok ? "success" : "error"](ok ? "Log copied" : "Copy not allowed");
  }, []);

  const onClear = useCallback(() => {
    clearTruecallerLog();
    setEntries([]);
  }, []);

  return (
    <div style={s.wrap}>
      <div style={s.head}>
        <span>Truecaller log ({entries.length})</span>
        <span style={{ fontWeight: 500 }}>
          {isSupported ? `state: ${status}` : `hidden: ${unsupportedReason}`}
        </span>
      </div>

      <div style={s.btnRow}>
        <button type="button" style={s.btn} onClick={onDownload}>
          Download .txt
        </button>
        <button type="button" style={s.btn} onClick={onCopy}>
          Copy
        </button>
        <button type="button" style={s.btn} onClick={onClear}>
          Clear
        </button>
      </div>

      {entries.length === 0 ? (
        <p style={s.empty}>
          Empty. Tap &quot;Continue with Truecaller&quot; and the whole attempt is
          recorded here — it survives the app switch and a reload.
        </p>
      ) : (
        <ul style={s.list}>
          {/* Newest first: the failure is the last thing that happened. */}
          {entries
            .slice(-40)
            .reverse()
            .map((e, i) => {
              const { t, run, event, ...rest } = e;
              // `run` groups the lines of one login attempt, so two attempts in
              // the same file are told apart without reading timestamps.
              const style = FAILURE_EVENTS.has(event)
                ? s.bad
                : SUCCESS_EVENTS.has(event)
                  ? s.good
                  : s.ev;
              return (
                <li key={`${t}-${i}`} style={s.row}>
                  <span style={{ color: "#9ca3af" }}>
                    {String(t).slice(11, 19)} [{run}]{" "}
                  </span>
                  <span style={style}>{event}</span>{" "}
                  {Object.keys(rest).length > 0 && (
                    <span>{JSON.stringify(rest)}</span>
                  )}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default TruecallerLogPanel;
