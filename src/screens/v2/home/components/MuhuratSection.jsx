import { useMemo } from "react";
import { useFetchAdvancePanchangQuery } from "../../../../redux/api/panchang/panchangApi";
import useUserLocation from "../../../../utils/hooks/useUserLocation";
import SectionHeader from "./SectionHeader";
import styles from "../Home.module.scss";

const formatTime = (time) => {
  if (!time) return "N/A";
  const [clock, meridiem] = time.split(" ");
  if (!clock) return time;
  const [hh, mm] = clock.split(":");
  return `${hh}:${mm} ${meridiem || ""}`.trim(); 
};

const MuhuratSection = () => {
  const pad = (num) => String(num).padStart(2, "0");
  const userLocation = useUserLocation();

  const payload = useMemo(() => {
    const now = new Date();
    return {
      day: pad(now.getDate()),
      month: pad(now.getMonth() + 1),
      year: now.getFullYear(),
      // Muhurats are date-based; pin the time so the cache key is stable for the
      // whole day instead of changing every minute (VedicAstro quota).
      hour: "12",
      min: "00",
      lat: userLocation.lat,
      lon: userLocation.lon,
      tzone: 5.5,
    };
  }, [userLocation.lat, userLocation.lon]);

  const { data, isLoading } = useFetchAdvancePanchangQuery(payload);
  const panchangData = data?.response;

  const muhurats = useMemo(() => {
    if (!panchangData) return [];
    return [
      {
        title: "Abhijit Muhurat",
        start: panchangData?.advanced_details?.abhijit_muhurta?.start,
        end: panchangData?.advanced_details?.abhijit_muhurta?.end,
      },
      {
        title: "Rahu Kaal",
        start: panchangData?.rahukaal?.split("to")[0]?.trim(),
        end: panchangData?.rahukaal?.split("to")[1]?.trim(),
      },
      {
        title: "Gulika Kaal",
        start: panchangData?.gulika?.split("to")[0]?.trim(),
        end: panchangData?.gulika?.split("to")[1]?.trim(),
      },
      {
        title: "Yamakanta Kaal",
        start: panchangData?.yamakanta?.split("to")[0]?.trim(),
        end: panchangData?.yamakanta?.split("to")[1]?.trim(),
      },
    ];
  }, [panchangData]);

  return (
    <section className={styles.muhuratSection}>
      <SectionHeader title="IMPORTANT MUHURATS" />

      {isLoading ? (
        <div className={styles.muhuratGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.muhuratCard} ${styles.skeleton}`}>
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.muhuratGrid}>
          {muhurats.map((m, i) => (
            <div key={i} className={styles.muhuratCard}>
              <h4 className={styles.muhuratCardTitle}>{m.title}</h4>
              <div className={styles.muhuratTimeRow}>
                <span className={`${styles.muhuratLabel} ${styles.start}`}>Start</span>
                <span className={styles.muhuratTime}>
                  {formatTime(m.start)}
                </span>
              </div>
              <div className={styles.muhuratTimeRow}>
                <span className={`${styles.muhuratLabel} ${styles.end}`}>End</span>
                <span className={styles.muhuratTime}>
                  {formatTime(m.end)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MuhuratSection;
