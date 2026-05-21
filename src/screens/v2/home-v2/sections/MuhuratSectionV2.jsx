import { memo, useMemo } from "react";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";

import abhijitIcon from "../../../../assets/images/Abhijit-Muhurat 1.png";
import rahuKaalIcon from "../../../../assets/images/Crucial Muhurats.png";
import gulikaIcon from "../../../../assets/images/Gulika-icon 1.png";
import yamakantaIcon from "../../../../assets/images/Crucial Muhurats (1).png";

const MUHURAT_ICONS = [abhijitIcon, rahuKaalIcon, gulikaIcon, yamakantaIcon];

const DEFAULT_MUHURATS = [
  { name: "Abhijit Muhurat", start: "—", end: "—" },
  { name: "Rahu Kaal", start: "—", end: "—" },
  { name: "Gulika Kaal", start: "—", end: "—" },
  { name: "Yamakanta Kaal", start: "—", end: "—" },
];

/** Strips seconds from time string: "12:14:20 PM" → "12:14 PM" */
const formatTime = (t) => {
  const val = t?.trim();
  if (!val) return "—";
  return val.replace(/(\d{1,2}:\d{2}):\d{2}/, "$1");
};

const MuhuratSectionV2 = memo(({ sectionData, styles }) => {
  const panchangPayload = useMemo(() => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return {
      day: pad(now.getDate()),
      month: pad(now.getMonth() + 1),
      year: now.getFullYear(),
      hour: pad(now.getHours()),
      min: pad(now.getMinutes()),
      lat: 19.132,
      lon: 72.342,
      tzone: 5.5,
    };
  }, []);

  const { data: panchangData } = useFetchAdvancePanchangQuery(panchangPayload);

  const muhurats = useMemo(() => {
    const response = panchangData?.response;
    if (!response) return DEFAULT_MUHURATS;

    return [
      {
        name: "Abhijit Muhurat",
        start: formatTime(response.advanced_details?.abhijit_muhurta?.start),
        end: formatTime(response.advanced_details?.abhijit_muhurta?.end),
      },
      {
        name: "Rahu Kaal",
        start: formatTime(response.rahukaal?.split("to")[0]),
        end: formatTime(response.rahukaal?.split("to")[1]),
      },
      {
        name: "Gulika Kaal",
        start: formatTime(response.gulika?.split("to")[0]),
        end: formatTime(response.gulika?.split("to")[1]),
      },
      {
        name: "Yamakanta Kaal",
        start: formatTime(response.yamakanta?.split("to")[0]),
        end: formatTime(response.yamakanta?.split("to")[1]),
      },
    ];
  }, [panchangData]);

  return (
    <div className={styles.rightPanel}>
      <h4>{sectionData?.display_title || sectionData?.title || "CRUCIAL MUHURATS"}</h4>
      <div className={styles.muhuratGrid}>
        {muhurats.map((m, i) => (
          <div key={m.name} className={styles.muhuratItem}>
            <div className={styles.muhuratTop}>
              <div className={styles.muhuratIcon}>
                <img src={MUHURAT_ICONS[i]} alt={m.name} width="40" height="40" loading="lazy" />
              </div>
              <h5>{m.name}</h5>
            </div>
            <p className={styles.muhuratTime}>
              {m.start} – {m.end}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

MuhuratSectionV2.displayName = "MuhuratSectionV2";

export default MuhuratSectionV2;
