import { useState, useEffect, useRef, useMemo } from "react";
import { useLazyGeoSearchQuery } from "../../redux/api/geoApi";
import Toast from "../../component/toast";
import styles from "./locationSearch.module.scss";

/*
  Wait for a pause in typing before hitting the geo endpoint.

  This used to fire on every single keystroke. A place like
  "Sri Ramnagar, Punjab, Pak" is ~25 characters, so it produced ~25 requests,
  and `isFetching` is true whenever the most recent one is outstanding. On a
  phone connection the requests take longer than the gaps between keystrokes,
  so the dropdown sat on "Searching…" essentially the whole time the visitor
  was typing and the suggestion list never settled long enough to tap.

  That is a dead end rather than a slow one: picking a suggestion is the only
  thing that sets latitude/longitude, and the submit handler refuses to continue
  without them. So the visitor cannot reach the coordinates no matter how many
  times they retype the place or resubmit the form.

  350ms matches the toast de-duplication window used elsewhere and is below the
  ~400ms at which a pause starts to feel like lag.
*/
const GEO_SEARCH_DEBOUNCE_MS = 350;

// `inputRef` is optional and exposes the text field to the caller. Callers that
// block on a missing place (the Muhurat CTA does) need to put the cursor back in
// this field when they say so, otherwise the message names a control the user
// then has to go hunting for.
// `reopenSignal` is an incrementing counter. Any change to it re-opens the
// suggestion list for whatever is currently typed, and re-runs the query if the
// list is empty. Callers that block submission on a missing pick use this so the
// suggestions they are telling the user to choose from are actually on screen —
// see the note on the effect below.
const LocationSearch = ({ value, onChange, onPlaceSelect, placeholder, disabled, dropUp = false, inputRef, reopenSignal = 0 }) => {
  const [triggerGeoSearch, { data, isFetching, isError }] = useLazyGeoSearchQuery();
  const [open, setOpen] = useState(false);
  const selectionMade = useRef(false); // Track if a place is selected
  const wrapperRef = useRef(null);
  // Last query actually sent, so the retry below can re-run it.
  const lastQueryRef = useRef("");
  const debounceRef = useRef(null);

  /*
    True from the keystroke until the debounced request is actually fired, at
    which point `isFetching` takes over. Without this the gap between the two
    would briefly expose the PREVIOUS query's `data` — so a half-typed city
    would flash stale suggestions, or "No results" for a place that exists.
  */
  const [searchPending, setSearchPending] = useState(false);

  // One flag for "the list is not settled yet", used to gate every branch below.
  const searching = searchPending || isFetching;

  // Any pending keystroke must not fire after the field goes away.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /*
    Ensure data is always an array, then float Indian places to the top.

    The geo endpoint (`geo-search-advanced?city=`) takes nothing but the query
    string — no country or region parameter — so it returns worldwide matches in
    whatever order it likes. For a partially-typed Indian city that regularly puts
    a small foreign town above the city the visitor meant: session replay caught
    someone in India setting their birth place to "Kolka, Cote d'Ivoire" while
    typing Kolkata, and then asking three questions about their future. Every
    prediction after that was computed for West Africa — wrong coordinates and a
    wrong timezone, silently. Same-name pairs make it worse: Hyderabad exists in
    both India and Pakistan.

    India-first matches what this product already assumes everywhere else: phone
    validation is +91-only in all three signup forms, and `handleSelect` below
    falls back to timezone 5.5 (IST) when the API omits one.

    Deliberately a reorder and not a filter — people are born abroad, and this is
    a birth-place field. Everything the API returned is still listed, in its
    original relative order within each group; only the grouping is new.
  */
  const results = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    if (list.length < 2) return list;

    const isIndian = (item) => {
      const code = String(item?.country ?? "").trim().toUpperCase();
      const name = String(item?.country_name ?? "").trim().toLowerCase();
      return code === "IN" || code === "IND" || name === "india";
    };

    // Array.prototype.sort is stable in every engine we target, so mapping to
    // 0/1 preserves the endpoint's own ranking inside each group.
    return [...list].sort((a, b) => Number(isIndian(b)) - Number(isIndian(a)));
  }, [data]);

  /*
    The dropdown used to close in only two situations: the query dropping below
    two characters, and a successful pick. There was no outside-click or Escape
    handling at all, so once it was open it stayed open — and callers pass
    `dropUp`, which renders it *upward* over the Birth Date and Birth Time
    fields. Clicks meant for those fields landed on a suggestion instead
    (silently replacing the birth place), and clicks on the dropdown's own
    padding or on the "Searching…" / "No results" rows did nothing at all.
  */
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Only call API when user types in input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    selectionMade.current = false; // reset selection
    onChange(e);

    clearTimeout(debounceRef.current);

    if (newValue && newValue.trim().length >= 2) {
      // Open and show "Searching…" straight away, so the field responds to the
      // keystroke even though the request itself waits for a pause.
      setOpen(true);
      setSearchPending(true);
      debounceRef.current = setTimeout(() => {
        // Passed raw: geoApi encodes it while building the URL. Encoding here too
        // double-encoded every space, so no multi-word city could ever be found.
        lastQueryRef.current = newValue;
        triggerGeoSearch(newValue);
        setSearchPending(false);
      }, GEO_SEARCH_DEBOUNCE_MS);
    } else {
      setSearchPending(false);
      setOpen(false);
    }
  };

  /*
    Re-open the list on demand.

    Coordinates are only ever set by picking a suggestion, so a caller that finds
    latitude/longitude missing tells the user to "select a valid location from the
    dropdown". That instruction is worthless if no dropdown is showing, and until
    this existed none reliably was: the caller's only lever was focusing the input
    and letting the `onFocus` handler below re-open as a side effect — but
    `focus()` does not fire a focus event on an element that already has focus,
    which is exactly the state a mobile visitor is in when they tap a submit
    button without the field being blurred first. So the message named a control
    that was not on screen, and the button got tapped again.

    Clarity, mobile, Instagram referral: repeated taps on "Continue & Get ₹250
    Bonus", resolving only once the visitor got a suggestion list up and picked
    Agartala, Tripura.

    Also re-issues the query when there is nothing to show — the debounce may
    have been cut short by the submit, leaving an empty list behind.
  */
  useEffect(() => {
    if (!reopenSignal) return;
    const query = (value || "").trim();
    if (query.length < 2) return;

    selectionMade.current = false;
    setOpen(true);

    const haveResults = Array.isArray(data) && data.length > 0;
    if (!haveResults || lastQueryRef.current !== query) {
      clearTimeout(debounceRef.current);
      lastQueryRef.current = query;
      setSearchPending(false);
      triggerGeoSearch(query);
    }
    // Deliberately keyed on the signal alone: this must fire when the caller says
    // so, not when `value` or `data` happen to change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenSignal]);

  const handleSelect = (item) => {
    const lat = Number(item?.coordinates?.[0]);
    const lng = Number(item?.coordinates?.[1]);

    // A suggestion without usable coordinates used to throw into a catch that
    // only console.error'd: the dropdown stayed open, nothing was filled in and
    // nothing was said, so the same row got clicked over and over.
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      Toast.error("That place is missing location data. Please pick another suggestion.");
      return;
    }

    onPlaceSelect({
      address: item.full_name,
      lat,
      lng,
      timezone: item.tz != null ? Number(item.tz) : 5.5,
    });

    selectionMade.current = true;
    setOpen(false);
  };

  return (
    <div className={`${styles.wrapper} notranslate`} ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange} // API triggers only here
        onFocus={() => {
          // Re-open on focus when there is already a query worth showing results
          // for, so returning to the field isn't a dead end.
          if (!selectionMade.current && value && value.length >= 2) setOpen(true);
        }}
        placeholder={placeholder || "Search for a city..."}
        className={styles.input}
        autoComplete="off"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && (
        <div
          className={styles.dropdown}
          style={dropUp ? { top: "auto", bottom: "100%", marginBottom: 8 } : undefined}
          role="listbox"
        >
          {/*
            A status message, not a control — it has no pointer cursor and
            nothing to activate. It gets clicked anyway when it is the only thing
            in the dropdown, which is what the debounce above is there to stop.
            aria-live so the state change is announced rather than only seen.
          */}
          {searching && (
            <div className={styles.loading} role="status" aria-live="polite">
              Searching…
            </div>
          )}

          {/*
            A failed lookup used to be indistinguishable from a successful empty
            one: `isError` was never read, so a network error or 5xx left `data`
            undefined, `results` empty, and the dropdown said "No results".

            That is the worst possible wording here. Picking a suggestion is the
            only way to set latitude/longitude, and the submit handler refuses to
            continue without them — so a broken lookup reads as "you typed the
            city wrong" and the visitor retypes variations of a place that does
            exist, with no way through and nothing telling them the search itself
            failed.
          */}
          {!searching && isError && (
            <div className={styles.noResult} role="status" aria-live="polite">
              Couldn&apos;t reach the location search.{" "}
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => {
                  // Deliberate tap, so it runs now rather than waiting out the
                  // debounce. Cancels any queued keystroke search first so the
                  // two cannot race.
                  clearTimeout(debounceRef.current);
                  setSearchPending(false);
                  if (lastQueryRef.current.trim().length >= 2) {
                    triggerGeoSearch(lastQueryRef.current);
                  }
                }}
              >
                Try again
              </button>
            </div>
          )}

          {/*
            Nothing matched.

            This was the bare string "No results", and it is the harshest dead end
            in this component: picking a suggestion is the ONLY way latitude and
            longitude get set, and every submit handler that uses this field
            refuses to continue without them. So two words with no route forward
            leave the visitor unable to finish the form at all — while the
            `isError` branch directly above, a strictly less final situation, gets
            both an explanation and a button.

            Clarity, Instagram mobile: a visitor filling the signup form produced a
            dead click on "No results" at 00:01:22, then kept going for another six
            minutes — 61 clicks, one page, registration never completed. This row
            is the only thing in the dropdown when it shows, so it is what gets
            tapped, exactly as the "Searching…" note above predicts.

            The endpoint is `geo-search-advanced?city=` — it matches a city, not a
            full address. So the single most useful thing to offer is a retry with
            just the first comma-separated segment, which is what someone typing
            "Surajpur, Chhattisgarh" needs. Offered only when there is actually a
            narrower query to try, so the button never appears as a no-op.
          */}
          {!searching && !isError && results.length === 0 && (
            <div className={styles.noResult} role="status" aria-live="polite">
              {(() => {
                const searched = lastQueryRef.current.trim();
                const firstSegment = searched.split(",")[0].trim();
                const canNarrow =
                  firstSegment.length >= 2 && firstSegment.length < searched.length;

                return (
                  <>
                    No matches{searched ? ` for “${searched}”` : ""}. Search by city
                    name and check the spelling.
                    {canNarrow && (
                      <>
                        {" "}
                        <button
                          type="button"
                          className={styles.retryBtn}
                          onClick={() => {
                            // Same guards as the error retry: cancel any queued
                            // keystroke search so the two cannot race.
                            clearTimeout(debounceRef.current);
                            setSearchPending(false);
                            selectionMade.current = false;
                            // Put the narrowed text in the field too, so what is
                            // searched and what is shown stay in step — and so a
                            // further edit starts from the working query.
                            onChange({ target: { value: firstSegment } });
                            lastQueryRef.current = firstSegment;
                            triggerGeoSearch(firstSegment);
                          }}
                        >
                          Search “{firstSegment}” instead
                        </button>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {!searching && !isError &&
            results.map((item, index) => {
              const displayName =
                item.full_name && item.country && item.country_name
                  ? item.full_name.replace(new RegExp(`${item.country}$`), item.country_name)
                  : item.full_name || "";

              return (
                // A real button: these rows were <div onClick>, so they were
                // unreachable by keyboard and invisible to assistive tech.
                <button
                  key={`${item.full_name || index}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={styles.item}
                  onClick={() => {
                    handleSelect({ ...item, full_name: displayName });
                  }}
                >
                  <strong>{displayName}</strong>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
