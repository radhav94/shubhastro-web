import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reasons openFileSelector can reject. Callers must branch on these: a
 * deliberate cancel deserves silence, anything else deserves a message. The
 * previous version rejected with the bare string "No file selected" for every
 * outcome, so all three call sites collapsed the two into
 * `catch { console.log("File selection cancelled") }` — including genuine
 * upload failures, which is why a photo that failed to send looked identical to
 * one the user chose not to send.
 */
export const FILE_SELECT_CANCELLED = "FILE_SELECT_CANCELLED";

export const useFileSelector = () => {
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  // Settles the in-flight promise, and is nulled the moment it runs so no path
  // can settle twice.
  const settleRef = useRef(null);

  const [selecting, setSelecting] = useState(false);

  const getInput = useCallback(() => {
    if (inputRef.current) return inputRef.current;

    const input = document.createElement("input");
    input.type = "file";
    /*
     * Attached to the document rather than left detached.
     *
     * A detached input's .click() works in ordinary browsers, which is why this
     * went unnoticed, but it is the same fragile pattern as the synthetic
     * <a download> that in-app browsers silently dropped elsewhere in this
     * codebase. Embedded webviews route the picker through the host app, and
     * that plumbing is the part that tends to ignore elements outside the
     * document. Attaching costs nothing and removes the variable.
     */
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0";
    input.tabIndex = -1;
    input.setAttribute("aria-hidden", "true");
    document.body.appendChild(input);

    inputRef.current = input;
    return input;
  }, []);

  useEffect(
    () => () => {
      // Reject anything still pending so an awaiting caller unwinds instead of
      // hanging on a promise that can never settle after unmount.
      settleRef.current?.reject(new Error(FILE_SELECT_CANCELLED));
      inputRef.current?.remove();
      inputRef.current = null;
    },
    [],
  );

  const openFileSelector = useCallback(
    (accept = "*") =>
      new Promise((resolve, reject) => {
        // A previous picker may still be pending — see the focus fallback below,
        // which cannot fire if the user never returns to the page. Abandon it
        // rather than leaving two promises racing over one shared input.
        settleRef.current?.reject(new Error(FILE_SELECT_CANCELLED));

        const input = getInput();
        input.accept = accept;
        // Required for re-picking the identical file: without it the value is
        // unchanged and no change event fires at all.
        input.value = "";

        setSelecting(true);

        let cleanup = () => {};

        const settle = (fn) => (arg) => {
          if (!settleRef.current) return;
          settleRef.current = null;
          cleanup();
          setSelecting(false);
          fn(arg);
        };

        const finish = settle(resolve);
        const abort = settle(reject);

        settleRef.current = { reject: abort };

        const handleChange = () => {
          const file = input.files && input.files[0];
          if (!file) {
            abort(new Error(FILE_SELECT_CANCELLED));
            return;
          }
          fileRef.current = file;
          finish({
            blob: file,
            name: file.name,
            size: file.size,
            type: file.type,
          });
        };

        // Chromium fires this when the picker is dismissed. Safari and the
        // webviews do not, hence the focus fallback.
        const handleCancel = () => abort(new Error(FILE_SELECT_CANCELLED));

        /*
         * Dismissing the picker fires no change event in most browsers, so the
         * promise used to stay pending forever: `selecting` was stuck true and
         * the awaiting caller never ran its catch. Returning focus to the page
         * without a file means the user backed out.
         *
         * The change event can arrive slightly after focus, so give it a frame
         * before concluding nothing was picked.
         */
        const handleFocus = () => {
          setTimeout(() => {
            if (!settleRef.current) return;
            if (input.files && input.files[0]) {
              handleChange();
              return;
            }
            abort(new Error(FILE_SELECT_CANCELLED));
          }, 400);
        };

        input.addEventListener("change", handleChange);
        input.addEventListener("cancel", handleCancel);
        // Registered on the next tick: the click below can itself move focus,
        // and we must not treat that as the user coming back.
        const focusTimer = setTimeout(
          () => window.addEventListener("focus", handleFocus),
          0,
        );

        cleanup = () => {
          clearTimeout(focusTimer);
          input.removeEventListener("change", handleChange);
          input.removeEventListener("cancel", handleCancel);
          window.removeEventListener("focus", handleFocus);
        };

        try {
          input.click();
        } catch (err) {
          abort(err instanceof Error ? err : new Error(String(err)));
        }
      }),
    [getInput],
  );

  const clearFile = useCallback(() => {
    fileRef.current = null;
    setSelecting(false);
  }, []);

  return {
    selecting,
    openFileSelector,
    clearFile,
  };
};
