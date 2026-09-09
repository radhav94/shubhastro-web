import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import useUserLocation from "../../../../utils/hooks/useUserLocation";
import { IoLocationOutline } from "react-icons/io5";

import { getMuhuratIcon, MUHURAT_FALLBACK_ICON } from "../../../../utils/muhuratIcons";

/** Strips seconds from time string: "12:17:35" → "12:17" (works with any script) */
const stripSeconds = (t) => {
  if (!t) return "—";
  return t.replace(/(\d{1,2}:\d{2}):\d{2}/g, "$1");
};

const DEFAULT_MUHURATS = [
  { name: "Abhijit Muhurat", start: "—", end: "—" },
  { name: "Rahu Kaal", start: "—", end: "—" },
  { name: "Gulika Kaal", start: "—", end: "—" },
  { name: "Yamakanta Kaal", start: "—", end: "—" },
];

const MuhuratSectionV2 = memo(({ sectionData, styles }) => {
  const navigate = useNavigate();
  const userLocation = useUserLocation();

  // This section only renders date-based muhurats (Abhijit, Rahu Kaal, Gulika,
  // Yamakanta), so the payload is pinned to midday. Using the live clock here
  // made the cache key change every minute, which meant a fresh VedicAstro hit
  // for practically every homepage view. Keep this day-stable.
  const panchangPayload = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      day: pad(now.getDate()),
      month: pad(now.getMonth() + 1),
      year: now.getFullYear(),
      hour: "12",
      min: "00",
      lat: userLocation.lat,
      lon: userLocation.lon,
      tzone: 5.5,
    };
  }, [userLocation.lat, userLocation.lon]);

  const { data: panchangData } = useFetchAdvancePanchangQuery(panchangPayload);

  const muhurats = useMemo(() => {
    const response = panchangData?.response;
    if (!response) return DEFAULT_MUHURATS;

    return [
      {
        name: "Abhijit Muhurat",
        start: stripSeconds(response.advanced_details?.abhijit_muhurta?.start) || "—",
        end: stripSeconds(response.advanced_details?.abhijit_muhurta?.end) || "—",
      },
      {
        name: "Rahu Kaal",
        start: response.rahukaal || "—",
        end: "",
      },
      {
        name: "Gulika Kaal",
        start: response.gulika || "—",
        end: "",
      },
      {
        name: "Yamakanta Kaal",
        start: response.yamakanta || "—",
        end: "",
      },
    ];
  }, [panchangData]);

  return (
    <div className={styles.rightPanel}>
      <div className={styles.muhuratHeader}>
        {/* h2/h3, not h4/h5. This widget sits in the hero row next to the "Your
            AI Suite" <h2>, and on mobile the .desktopOnly cards between them are
            hidden, so the outline jumped h2 → h4 right here. Sizes come from
            .rightPanel h2 / .muhuratTop h3 in HomeV2.module.scss. */}
        <h2>{sectionData?.display_title || sectionData?.title || "TODAY'S MUHURAT"}</h2>
        {!userLocation.isDefault && userLocation.locationName && (
          <span className={styles.muhuratLocation}>
            <IoLocationOutline />
            {userLocation.locationName.split(",")[0]}
          </span>
        )}
      </div>
      <div className={styles.muhuratGrid}>
        {muhurats.map((m) => (
          <div
            key={m.name}
            className={styles.muhuratItem}
            onClick={() => navigate("/aiwow/muhurat-calendar")}
            /* role="button" + tabIndex advertise this as a control, so it has to
               answer Enter/Space too. Without the key handler the card took focus
               and then did nothing when activated — a dead click for anyone not
               using a mouse. */
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("/aiwow/muhurat-calendar");
              }
            }}
            role="button"
            tabIndex={0}
            style={{ cursor: "pointer" }}
          >
            <div className={styles.muhuratTop}>
              {/* <div className={styles.muhuratIcon}> */}
                {/* alt="" — the <h3> beside it is already m.name, so a filled alt
                    made a screen reader say the muhurat name twice. */}
                <img src={getMuhuratIcon(m.name)} alt="" width="40" height="40" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = MUHURAT_FALLBACK_ICON; }} />
              {/* </div> */}
              {m.name}
            </div>
            {/* <p className={styles.muhuratTime}> */}
              {m.end ? `${m.start} to ${m.end}` : m.start}
            {/* </p> */}
          </div>
        ))}
      </div>
    </div>
  );
});

MuhuratSectionV2.displayName = "MuhuratSectionV2";

export default MuhuratSectionV2;
