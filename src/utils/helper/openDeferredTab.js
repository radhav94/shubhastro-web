/**
 * Opens a browser tab NOW and points it at a URL later.
 *
 * The problem this exists for: several places here fetch a document URL and then
 * open it —
 *
 *     const data = await getInvoice(id).unwrap();
 *     window.open(data.pdfUrl, "_blank");
 *
 * — and that never works reliably. `window.open` is only permitted while a user
 * gesture is active, and the gesture is spent synchronously: it does not survive
 * the `await`. Desktop Chrome treats the later call as an unrequested popup and
 * blocks it behind a small address-bar icon that is easy to miss; iOS Safari and
 * in-app WebViews drop it outright. Either way the visitor taps "Receipt", the
 * spinner runs and stops, and nothing opens.
 *
 * The fix is to claim the tab inside the click, while permission still exists,
 * and navigate it once the URL arrives.
 *
 * Note on `noopener`: passing it to `window.open` makes the call return `null`,
 * so the handle needed to navigate the tab later would be gone. `opener` is
 * cleared manually instead, which gives the same protection for the window we
 * control.
 *
 * @returns {{ blocked: boolean, settle: (url: string) => boolean, abort: () => void }}
 */
export const openDeferredTab = () => {
  let win = null;

  try {
    win = window.open("", "_blank");
  } catch {
    win = null;
  }

  if (win) {
    // Reverse-tabnabbing protection, since `noopener` cannot be used here.
    try {
      win.opener = null;
    } catch {
      /* already navigated cross-origin — nothing to clear */
    }
    // An empty tab reads as a broken one while the request is in flight.
    try {
      win.document.write(
        "<!doctype html><title>Opening…</title><body style=\"font:16px system-ui;padding:24px;color:#555\">Opening your document…</body>"
      );
      win.document.close();
    } catch {
      /* some browsers disallow writing to about:blank; harmless */
    }
  }

  return {
    // True when the browser refused the tab even inside the gesture. Rare, but
    // callers should still have a path for it.
    blocked: !win,

    /**
     * Sends the tab to `url`. Returns false when there is no usable tab, so the
     * caller can fall back rather than silently losing the document.
     */
    settle(url) {
      if (!win || win.closed || !url) return false;
      try {
        win.location.replace(url);
        return true;
      } catch {
        return false;
      }
    },

    /** Closes the placeholder — for failures, so no blank tab is left behind. */
    abort() {
      if (win && !win.closed) {
        try {
          win.close();
        } catch {
          /* ignore */
        }
      }
    },
  };
};

export default openDeferredTab;
