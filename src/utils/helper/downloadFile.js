import Toast from "../../component/toast";
import { isInAppBrowser } from "../deviceInfo";

/**
 * Downloads a remote file, with a working fallback for in-app browsers.
 *
 * Facebook / Instagram / WeChat webviews silently ignore a synthetic
 * `<a download>` click, so callers that assumed success were showing
 * "downloaded!" toasts while nothing reached the device. This helper reports
 * what actually happened so the caller can message the user honestly.
 *
 * @param {string} url       Absolute URL of the file to fetch.
 * @param {string} fileName  Suggested name for the saved file.
 * @returns {Promise<"downloaded"|"opened"|"failed">}
 *   - "downloaded" the file was saved via a blob download
 *   - "opened"     the browser cannot save files, so it was opened in a new tab
 *   - "failed"     nothing happened; show an error
 */
export const downloadFile = async (url, fileName) => {
  if (!url) return "failed";

  // In-app webviews can't save blobs. Hand the URL to the browser directly so
  // the user at least sees the file and can use "open in browser" / share.
  if (isInAppBrowser()) {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return "opened";
    // Popup blocked - navigating the current tab is the last resort.
    window.location.href = url;
    return "opened";
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);

    return "downloaded";
  } catch (error) {
    console.error("downloadFile failed:", error);

    // Fetch can fail on CORS or an expired signed URL. Opening the URL still
    // gets the user to the file, so try that before declaring failure.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    return opened ? "opened" : "failed";
  }
};

/**
 * Shows the toast matching a `downloadFile` result.
 *
 * @param {"downloaded"|"opened"|"failed"} outcome
 * @param {string} [label] Human name for the file, e.g. "PDF" or "Report".
 */
export const toastDownloadOutcome = (outcome, label = "File") => {
  if (outcome === "downloaded") {
    Toast.success(`${label} downloaded!`);
  } else if (outcome === "opened") {
    Toast.success(`${label} opened in a new tab. Use your browser menu to save it.`);
  } else {
    Toast.error(`Could not download the ${label.toLowerCase()}. Please try again.`);
  }
};
