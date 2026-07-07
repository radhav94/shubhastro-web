import { memo, useMemo } from "react";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import useUserLocation from "../../../../utils/hooks/useUserLocation";
import { IoLocationOutline } from "react-icons/io5";

import abhijitIcon from "../../../../assets/images/Abhijit-Muhurat 1.png";
import rahuKaalIcon from "../../../../assets/images/Crucial Muhurats.png";
import gulikaIcon from "../../../../assets/images/Gulika-icon 1.png";
import yamakantaIcon from "../../../../assets/images/Crucial Muhurats (1).png";
import defaultSquareImg from "../../../../assets/images/default_image_square_500x500.png";
const MUHURAT_ICONS = [abhijitIcon, rahuKaalIcon, gulikaIcon, yamakantaIcon];

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
  const userLocation = useUserLocation();

  const panchangPayload = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      day: pad(now.getDate()),
      month: pad(now.getMonth() + 1),
      year: now.getFullYear(),
      hour: pad(now.getHours()),
      min: pad(now.getMinutes()),
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
        <h4>{sectionData?.display_title || sectionData?.title || "TODAY'S MUHARAT"}</h4>
        <span className={styles.muhuratLocation}>
          <IoLocationOutline />
          {userLocation.locationName
            ? userLocation.locationName.split(",")[0]
            : "Mumbai"}
        </span>
      </div>
      <div className={styles.muhuratGrid}>
        {muhurats.map((m, i) => (
          <div key={m.name} className={styles.muhuratItem}>
            <div className={styles.muhuratTop}>
              <div className={styles.muhuratIcon}>
                <img src={MUHURAT_ICONS[i] || defaultSquareImg} alt={m.name} width="40" height="40" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src = defaultSquareImg; }} />
              </div>
              <h5>{m.name}</h5>
            </div>
            <p className={styles.muhuratTime}>
              {m.end ? `${m.start} to ${m.end}` : m.start}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

MuhuratSectionV2.displayName = "MuhuratSectionV2";

export default MuhuratSectionV2;
