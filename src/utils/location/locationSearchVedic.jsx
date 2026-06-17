import { useState, useEffect, useRef } from "react";
import { useLazyGeoSearchQuery } from "../../redux/api/geoApi";
import styles from "./locationSearch.module.scss";

const LocationSearch = ({ value, onChange, onPlaceSelect, placeholder, disabled }) => {
  const [triggerGeoSearch, { data, isFetching }] = useLazyGeoSearchQuery();
  const [open, setOpen] = useState(false);
  const selectionMade = useRef(false); // Track if a place is selected

  // Ensure data is always an array
  const results = Array.isArray(data) ? data : [];

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
    try {
      const lat = Number(item.coordinates[0]);
      const lng = Number(item.coordinates[1]);

      onPlaceSelect({
        address: item.full_name,
        lat,
        lng,
        timezone: item.tz != null ? Number(item.tz) : 5.5,
      });

      selectionMade.current = true;
      setOpen(false);
    } catch (err) {
      console.error("Error selecting place:", err);
    }
  };

  return (
    <div className={`${styles.wrapper} notranslate`}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange} // API triggers only here
        placeholder={placeholder || "Search for a city..."}
        className={styles.input}
        autoComplete="off"
        disabled={disabled}
      />

      {open && (
        <div className={styles.dropdown}>
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
                <div
                  key={`${item.full_name || index}-${index}`}
                  className={styles.item}
                  onClick={(e) => {
                    handleSelect({ ...item, full_name: displayName });
                  }}
                >
                  <strong>{displayName}</strong>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
