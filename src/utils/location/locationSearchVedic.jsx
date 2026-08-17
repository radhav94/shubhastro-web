import { useState, useEffect, useRef } from "react";
import { useLazyGeoSearchQuery } from "../../redux/api/geoApi";
import Toast from "../../component/toast";
import styles from "./locationSearch.module.scss";

const LocationSearch = ({ value, onChange, onPlaceSelect, placeholder, disabled, dropUp = false }) => {
  const [triggerGeoSearch, { data, isFetching }] = useLazyGeoSearchQuery();
  const [open, setOpen] = useState(false);
  const selectionMade = useRef(false); // Track if a place is selected
  const wrapperRef = useRef(null);

  // Ensure data is always an array
  const results = Array.isArray(data) ? data : [];

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

    if (newValue && newValue.length >= 2) {
      triggerGeoSearch(encodeURIComponent(newValue)); // call API
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

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
          {isFetching && <div className={styles.loading}>Searching…</div>}

          {!isFetching && results.length === 0 && (
            <div className={styles.noResult}>No results</div>
          )}

          {!isFetching &&
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
